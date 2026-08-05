import { renderToStaticMarkup } from "@hacado/email-builder/static";
import { getLoggerFactory, LoggerFactory } from "@hacado/logger";
import {
  AppJobRequest,
  ConnectedAppData,
  IServicesContainer,
} from "@hacado/types";
import {
  Args,
  formatAmountWithCurrency,
  getAdminUrl,
  getArguments,
  getWebsiteUrl,
  templateSafeWithError,
} from "@hacado/utils";
import { DateTime } from "luxon";
import { Readable } from "stream";
import { png2pdf, renderGiftCard } from "../designer/lib/render/render";
import { GiftCardStudioSettings, PurchasedGiftCardListModel } from "../models";
import { GiftCardStudioJobPayload } from "../models/app";
import { giftCardStudioInvoiceTranslations } from "../translations/invoice";
import { GiftCardStudioAdminAllKeys } from "../translations/types";
import { GiftCardStudioRepositoryService } from "./repository-service";
import { getFileName } from "./utils";

export class GiftCardStudioJobProcessor {
  protected readonly loggerFactory: LoggerFactory;
  public constructor(
    protected readonly organizationId: string,
    protected readonly services: IServicesContainer,
    protected readonly repository: GiftCardStudioRepositoryService,
  ) {
    this.loggerFactory = getLoggerFactory(
      "GiftCardStudioJobProcessor",
      organizationId,
    );
  }

  public async processJob(
    appData: ConnectedAppData,
    jobData: AppJobRequest<GiftCardStudioJobPayload>,
  ): Promise<void> {
    const logger = this.loggerFactory("processJob");
    logger.debug(
      { appId: appData._id, jobData },
      "Processing Gift Card Studio job",
    );

    switch (jobData.payload.type) {
      case "generate-gift-card":
        return this.processGenerateGiftCard(
          appData,
          jobData.payload.purchasedGiftCardId,
          jobData.payload.sendEmails,
        );
      case "generate-invoice":
        return this.processGenerateInvoice(
          appData,
          jobData.payload.purchasedGiftCardId,
          jobData.payload.sendEmails,
        );
      default:
        logger.error({ appId: appData._id, jobData }, "Unsupported job type");
        throw new Error("Unsupported job type");
    }
  }

  private async processGenerateGiftCard(
    appData: ConnectedAppData,
    purchasedGiftCardId: string,
    sendEmails?: {
      recipient: boolean;
      customer: boolean;
    },
  ): Promise<void> {
    const logger = this.loggerFactory("processGenerateGiftCard");
    logger.debug(
      { appId: appData._id, purchasedGiftCardId },
      "Processing Generate Gift Card job",
    );

    try {
      const purchasedGiftCard =
        await this.repository.getPurchasedGiftCardById(purchasedGiftCardId);
      if (!purchasedGiftCard) {
        logger.error(
          { appId: appData._id, purchasedGiftCardId },
          "Purchased gift card not found",
        );
        throw new Error("Purchased gift card not found");
      }

      const customer = await this.services.customersService.getCustomer(
        purchasedGiftCard.customerId,
      );
      if (!customer) {
        logger.error(
          { appId: appData._id, customerId: purchasedGiftCard.customerId },
          "Customer not found",
        );
        throw new Error("Customer not found");
      }

      const design = await this.repository.getDesignById(
        purchasedGiftCard.designId,
      );
      if (!design) {
        logger.error(
          { appId: appData._id, designId: purchasedGiftCard.designId },
          "Design not found",
        );
        throw new Error("Design not found");
      }

      const giftCard = await this.services.giftCardsService.getGiftCard(
        purchasedGiftCard.giftCardId,
      );

      if (!giftCard) {
        logger.error(
          { appId: appData._id, giftCardId: purchasedGiftCard.giftCardId },
          "Gift card not found",
        );
        throw new Error("Gift card not found");
      }

      const { general, brand } =
        await this.services.configurationService.getConfigurations(
          "general",
          "brand",
        );

      let expiresAt: DateTime | null = null;
      if (giftCard.expiresAt) {
        expiresAt = DateTime.fromJSDate(giftCard.expiresAt)
          .setZone(general.timeZone)
          .setLocale(brand.language);
      }

      const amountFormatted = formatAmountWithCurrency(
        purchasedGiftCard.amountPurchased,
        brand.language,
        general.currency,
      );

      logger.debug(
        { appId: appData._id, purchasedGiftCardId, expiresAt },
        "Generating gift card",
      );

      const generatedPng = await renderGiftCard({
        design: design.design,
        fields: {
          amount: amountFormatted,
          code: giftCard.code,
          expiresAt,
          to: purchasedGiftCard.toName ?? giftCard.customer.name,
          from: giftCard.customer.name,
          message: purchasedGiftCard.message,
        },
        format: "png",
      });

      const pngFileName = getFileName(
        appData._id,
        purchasedGiftCardId,
        "gift-card",
        "png",
      );
      logger.debug(
        { appId: appData._id, purchasedGiftCardId, pngFileName },
        "Generated gift card PNG",
      );

      const generatedPdf = await png2pdf(design.design, generatedPng);
      const pdfFileName = getFileName(
        appData._id,
        purchasedGiftCardId,
        "gift-card",
        "pdf",
      );
      logger.debug(
        { appId: appData._id, purchasedGiftCardId, pngFileName, pdfFileName },
        "Generated gift card PDF, saving to storage",
      );

      await this.services.assetsStorage.saveFile(
        pngFileName,
        Readable.from(generatedPng),
        generatedPng.length,
      );
      logger.debug(
        { appId: appData._id, purchasedGiftCardId, pngFileName },
        "Saved gift card PNG to storage",
      );

      await this.services.assetsStorage.saveFile(
        pdfFileName,
        Readable.from(generatedPdf),
        generatedPdf.length,
      );

      logger.debug(
        { appId: appData._id, purchasedGiftCardId },
        "Successfully generated gift card. Marking as generation status completed",
      );

      await this.repository.updatePurchasedGiftCardStatus(purchasedGiftCardId, {
        cardGenerationStatus: "completed",
      });

      if (!sendEmails?.recipient && !sendEmails?.customer) {
        return;
      }

      logger.debug(
        { appId: appData._id, purchasedGiftCardId, sendEmails },
        "Sending email to recipient and/or customer",
      );

      if (sendEmails.recipient) {
        await this.sendEmailToRecipient(appData, purchasedGiftCard);
      }

      if (sendEmails.customer) {
        await this.sendEmailToCustomer(appData, purchasedGiftCard);
      }

      logger.debug(
        { appId: appData._id, purchasedGiftCardId },
        "Successfully sent emails to recipient and/or customer",
      );
    } catch (error) {
      logger.error(
        { appId: appData._id, purchasedGiftCardId, error },
        "Error generating gift card",
      );

      await this.repository.updatePurchasedGiftCardStatus(purchasedGiftCardId, {
        cardGenerationStatus: "failed",
      });

      throw error;
    }
  }

  private async processGenerateInvoice(
    appData: ConnectedAppData,
    purchasedGiftCardId: string,
    sendEmails?: {
      customer: boolean;
    },
  ): Promise<void> {
    const logger = this.loggerFactory("processGenerateInvoice");
    logger.debug(
      { appId: appData._id, purchasedGiftCardId },
      "Processing Generate Invoice job",
    );
    try {
      const purchasedGiftCard =
        await this.repository.getPurchasedGiftCardById(purchasedGiftCardId);
      if (!purchasedGiftCard) {
        logger.error(
          { appId: appData._id, purchasedGiftCardId },
          "Purchased gift card not found",
        );
        throw new Error("Purchased gift card not found");
      }

      const customer = await this.services.customersService.getCustomer(
        purchasedGiftCard.customerId,
      );
      if (!customer) {
        logger.error(
          { appId: appData._id, customerId: purchasedGiftCard.customerId },
          "Customer not found",
        );
        throw new Error("Customer not found");
      }

      const giftCard = await this.services.giftCardsService.getGiftCard(
        purchasedGiftCard.giftCardId,
      );
      if (!giftCard) {
        logger.error(
          { appId: appData._id, giftCardId: purchasedGiftCard.giftCardId },
          "Gift card not found",
        );
        throw new Error("Gift card not found");
      }

      const payment = giftCard.paymentId
        ? await this.services.paymentsService.getPayment(giftCard.paymentId)
        : null;

      const { general, brand } =
        await this.services.configurationService.getConfigurations(
          "general",
          "brand",
        );

      const issuedAt = DateTime.now()
        .setZone(general.timeZone)
        .setLocale(brand.language);
      const amountFormatted = formatAmountWithCurrency(
        purchasedGiftCard.amountPurchased,
        brand.language,
        general.currency,
      );

      const invoiceNumber = `GC-${purchasedGiftCardId}`;

      const t =
        giftCardStudioInvoiceTranslations[brand.language] ??
        giftCardStudioInvoiceTranslations.en;

      let logoBuffer: Buffer | null = null;
      if (brand.logo) {
        try {
          if (
            brand.logo.startsWith("http://") ||
            brand.logo.startsWith("https://")
          ) {
            const response = await fetch(brand.logo);
            if (response.ok) {
              const arrayBuffer = await response.arrayBuffer();
              logoBuffer = Buffer.from(arrayBuffer);
            }
          } else {
            const logoFilename = brand.logo.startsWith("/assets/")
              ? brand.logo.slice(8)
              : brand.logo;
            const logoResult =
              await this.services.assetsStorage.getFile(logoFilename);
            if (logoResult) {
              const { stream } = logoResult;
              const buffers: Buffer[] = [];
              await new Promise<void>((resolveStream, rejectStream) => {
                stream.on("data", (chunk: Buffer) => buffers.push(chunk));
                stream.on("end", () => resolveStream());
                stream.on("error", (err: unknown) => rejectStream(err));
              });
              logoBuffer = Buffer.concat(buffers);
            }
          }
        } catch {
          logoBuffer = null;
        }
      }

      const pdfkit = await import("pdfkit");
      const PDFDocument = pdfkit.default;
      const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
        const doc = new PDFDocument({ margin: 40 });
        const chunks: Buffer[] = [];

        doc.on("data", (chunk: Buffer) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);

        const pageWidth = doc.page.width;
        const pageMargin = 40;
        const contentWidth = pageWidth - pageMargin * 2;

        const leftX = pageMargin;
        const rightX = pageMargin + contentWidth / 2;
        let y = pageMargin;

        // Optional logo above business name
        if (logoBuffer) {
          const logoMaxWidth = contentWidth / 4;
          const logoMaxHeight = 40;
          doc.image(logoBuffer, leftX, y, {
            fit: [logoMaxWidth, logoMaxHeight],
          });
          y += 50;
        }

        // Header: organization name on the left
        doc.fontSize(20).fillColor("#111111");
        doc.text(general.name ?? t.invoiceTitle, leftX, y, {
          width: contentWidth / 2,
          align: "left",
        });

        y += 26;

        if (general.address || general.phone) {
          doc.fontSize(10).fillColor("#555555");
          doc.text(general.address ?? "", leftX, y, {
            width: contentWidth / 2,
            align: "left",
          });
          y += 14;
          if (general.phone) {
            doc.text(general.phone, leftX, y, {
              width: contentWidth / 2,
              align: "left",
            });
            y += 14;
          }
        }

        // Header: invoice meta on the right
        const headerRightY = pageMargin;
        doc.fontSize(22).fillColor("#111111");
        doc.text(t.invoiceTitle, rightX, headerRightY, {
          width: contentWidth / 2,
          align: "right",
        });

        doc.fontSize(10).fillColor("#555555");
        doc.text(
          `${t.invoiceNumberLabel} ${invoiceNumber}`,
          rightX,
          headerRightY + 28,
          {
            width: contentWidth / 2,
            align: "right",
          },
        );
        doc.text(
          `${t.dateLabel} ${issuedAt.toFormat(t.invoiceDateFormat)}`,
          rightX,
          headerRightY + 42,
          {
            width: contentWidth / 2,
            align: "right",
          },
        );

        // Move below header
        y = Math.max(y + 20, headerRightY + 70);

        // Top separator
        doc
          .moveTo(pageMargin, y)
          .lineTo(pageWidth - pageMargin, y)
          .lineWidth(1)
          .strokeColor("#dddddd")
          .stroke();

        y += 20;

        // Bill to section
        doc.fontSize(11).fillColor("#111111").font("Helvetica-Bold");
        doc.text(t.billTo, leftX, y, {
          width: contentWidth / 2,
          align: "left",
        });
        y += 16;

        doc.fontSize(10).fillColor("#000000").font("Helvetica");
        doc.text(customer.name ?? "", leftX, y, {
          width: contentWidth / 2,
          align: "left",
        });
        y += 14;
        if (customer.email) {
          doc.text(customer.email, leftX, y, {
            width: contentWidth / 2,
            align: "left",
          });
          y += 14;
        }
        if ((customer as any).phone) {
          doc.text((customer as any).phone, leftX, y, {
            width: contentWidth / 2,
            align: "left",
          });
          y += 16;
        } else {
          y += 8;
        }

        // Summary title
        doc.fontSize(11).fillColor("#111111").font("Helvetica-Bold");
        doc.text(t.summary, leftX, y, {
          width: contentWidth,
          align: "left",
        });
        y += 22;

        // Table layout similar to the HTML-style invoice
        const colDescriptionWidth = contentWidth * 0.5;
        const colQtyWidth = contentWidth * 0.15;
        const colUnitWidth = contentWidth * 0.15;
        const colAmountWidth = contentWidth * 0.2;

        const headerHeight = 20;
        const headerY = y;

        // Header background
        doc
          .rect(pageMargin, headerY, contentWidth, headerHeight)
          .fillAndStroke("#f5f5f5", "#e0e0e0");

        doc.fillColor("#111111").fontSize(10).font("Helvetica-Bold");
        doc.text(t.itemLabel, pageMargin + 8, headerY + 5, {
          width: colDescriptionWidth - 16,
          align: "left",
        });
        doc.text(
          t.quantityLabel,
          pageMargin + colDescriptionWidth,
          headerY + 5,
          {
            width: colQtyWidth,
            align: "center",
          },
        );
        doc.text(
          t.unitPriceLabel,
          pageMargin + colDescriptionWidth + colQtyWidth,
          headerY + 5,
          {
            width: colUnitWidth,
            align: "right",
          },
        );
        doc.text(
          t.amountLabel,
          pageMargin + colDescriptionWidth + colQtyWidth + colUnitWidth,
          headerY + 5,
          {
            width: colAmountWidth - 8,
            align: "right",
          },
        );

        y = headerY + headerHeight;

        // Single line item
        const rowHeight = 26;
        const rowY = y;

        doc.fontSize(10).fillColor("#000000");
        doc.text(
          templateSafeWithError(t.giftCardItemLabel, {
            code: giftCard.code,
            toName: purchasedGiftCard.toName ?? "",
          }),
          pageMargin + 8,
          rowY + 6,
          {
            width: colDescriptionWidth - 16,
            align: "left",
          },
        );
        doc.text("1", pageMargin + colDescriptionWidth, rowY + 6, {
          width: colQtyWidth,
          align: "center",
        });
        doc.text(
          amountFormatted,
          pageMargin + colDescriptionWidth + colQtyWidth,
          rowY + 6,
          {
            width: colUnitWidth,
            align: "right",
          },
        );
        doc.text(
          amountFormatted,
          pageMargin + colDescriptionWidth + colQtyWidth + colUnitWidth,
          rowY + 6,
          {
            width: colAmountWidth - 8,
            align: "right",
          },
        );

        y = rowY + rowHeight + 10;

        // Totals box on the right
        const totalsY = headerY + headerHeight + rowHeight + 10;
        const totalsBoxWidth = contentWidth * 0.35;
        const totalsBoxX = pageMargin + contentWidth - totalsBoxWidth;

        // Divider above totals
        doc
          .moveTo(totalsBoxX, totalsY - 4)
          .lineTo(totalsBoxX + totalsBoxWidth, totalsY - 4)
          .lineWidth(1)
          .strokeColor("#dddddd")
          .stroke();

        // Total, amount paid and balance
        const amountPaid = amountFormatted;
        const balance = formatAmountWithCurrency(
          0,
          brand.language,
          general.currency,
        );

        doc.fontSize(10).fillColor("#111111").font("Helvetica-Bold");
        doc.text(t.totalLabel, totalsBoxX, totalsY, {
          width: totalsBoxWidth / 2,
          align: "left",
        });
        doc.text(amountFormatted, totalsBoxX, totalsY, {
          width: totalsBoxWidth,
          align: "right",
        });

        doc.fontSize(10).fillColor("#111111").font("Helvetica");
        doc.text(t.amountPaidLabel, totalsBoxX, totalsY + 16, {
          width: totalsBoxWidth / 2,
          align: "left",
        });
        doc.text(amountPaid, totalsBoxX, totalsY + 16, {
          width: totalsBoxWidth,
          align: "right",
        });

        doc.text(t.balanceLabel, totalsBoxX, totalsY + 32, {
          width: totalsBoxWidth / 2,
          align: "left",
        });
        doc.text(balance, totalsBoxX, totalsY + 32, {
          width: totalsBoxWidth,
          align: "right",
        });

        // Footer note
        const footerY = totalsY + 64;
        doc.fontSize(9).fillColor("#777777");
        doc.text(t.footerNote, leftX, footerY, {
          width: contentWidth,
          align: "left",
        });

        doc.end();
      });

      const invoiceFileName = getFileName(
        appData._id,
        purchasedGiftCardId,
        "invoice",
        "pdf",
      );

      await this.services.assetsStorage.saveFile(
        invoiceFileName,
        Readable.from(pdfBuffer),
        pdfBuffer.length,
      );

      logger.debug(
        {
          appId: appData._id,
          purchasedGiftCardId,
          invoiceFileName,
        },
        "Invoice PDF generated and saved to storage",
      );

      await this.repository.updatePurchasedGiftCardStatus(purchasedGiftCardId, {
        invoiceGenerationStatus: "completed",
      });

      if (!sendEmails?.customer) {
        return;
      }

      await this.sendEmailToCustomer(appData, purchasedGiftCard);

      logger.debug(
        { appId: appData._id, purchasedGiftCardId },
        "Successfully sent email to customer",
      );
    } catch (error) {
      logger.error(
        { appId: appData._id, purchasedGiftCardId, error },
        "Error generating invoice",
      );

      await this.repository.updatePurchasedGiftCardStatus(purchasedGiftCardId, {
        invoiceGenerationStatus: "failed",
      });

      throw error;
    }
  }

  public async sendEmailToRecipient(
    appData: ConnectedAppData,
    purchasedGiftCard: PurchasedGiftCardListModel,
  ): Promise<void> {
    const logger = this.loggerFactory("sendEmailToRecipient");
    const purchasedGiftCardId = purchasedGiftCard._id;
    const customer = purchasedGiftCard.customer;
    logger.debug(
      { appId: appData._id, purchasedGiftCardId },
      "Sending email to recipient",
    );

    if (
      !purchasedGiftCard.toEmail ||
      purchasedGiftCard.toEmail === customer.email
    ) {
      logger.debug(
        { appId: appData._id, purchasedGiftCardId },
        "Recipient email is not set or is the same as the customer email, skipping email to recipient",
      );
      return;
    }

    const settings = appData.data as GiftCardStudioSettings;

    const emailTemplate = await this.services.templatesService.getTemplate(
      settings.emailTemplateIdToRecipient,
    );
    if (!emailTemplate) {
      logger.debug(
        { appId: appData._id, purchasedGiftCardId },
        "Email template not found, skipping",
      );
      return;
    }

    if (emailTemplate.type !== "email") {
      logger.debug(
        { appId: appData._id, purchasedGiftCardId },
        "Email template is not an email template, skipping",
      );
      return;
    }

    if (!settings.emailTemplateIdToRecipient) {
      logger.debug(
        { appId: appData._id, purchasedGiftCardId },
        "Email template ID for recipient not set, skipping",
      );
      return;
    }

    const updatedPurchasedGiftCard =
      await this.repository.getPurchasedGiftCardReadyToSendEmails(
        purchasedGiftCardId,
        "recipient",
      );
    if (!updatedPurchasedGiftCard) {
      logger.debug(
        { appId: appData._id, purchasedGiftCardId },
        "Purchased gift card not ready to send emails",
      );
      return;
    }

    const args = await this.getEmailTemplateArguments(
      appData,
      purchasedGiftCard,
    );

    const subject = templateSafeWithError(emailTemplate.subject, args);
    const renderedTemplate = await renderToStaticMarkup({
      args,
      document: emailTemplate.value,
    });

    const giftCardPdfFileName = getFileName(
      appData._id,
      purchasedGiftCardId,
      "gift-card",
      "pdf",
    );

    await this.services.notificationService.sendEmail({
      email: {
        to: purchasedGiftCard.toEmail,
        subject,
        body: renderedTemplate,
        attachments: [
          {
            filename: "gift-card.pdf",
            contentType: "application/pdf",
            storageFilename: giftCardPdfFileName,
            cid: "gift-card-pdf",
          },
        ],
      },
      participantType: "customer",
      handledBy: {
        key: "app_gift-card-studio_admin.handlers.send-email-to-recipient" satisfies GiftCardStudioAdminAllKeys,
        args: {
          name: purchasedGiftCard.toName ?? customer.name,
        },
      },
    });

    logger.debug(
      { appId: appData._id, purchasedGiftCardId },
      "Successfully sent email to recipient",
    );
  }

  public async sendEmailToCustomer(
    appData: ConnectedAppData,
    purchasedGiftCard: PurchasedGiftCardListModel,
  ): Promise<void> {
    const logger = this.loggerFactory("sendEmailToCustomer");
    const purchasedGiftCardId = purchasedGiftCard._id;
    const customer = purchasedGiftCard.customer;
    logger.debug(
      { appId: appData._id, purchasedGiftCardId },
      "Sending email to customer",
    );

    const settings = appData.data as GiftCardStudioSettings;
    if (!settings.emailTemplateIdToPurchaser) {
      logger.debug(
        { appId: appData._id, purchasedGiftCardId },
        "Email template ID for customer not set, skipping",
      );
      return;
    }

    const emailTemplate = await this.services.templatesService.getTemplate(
      settings.emailTemplateIdToPurchaser,
    );
    if (!emailTemplate) {
      logger.debug(
        { appId: appData._id, purchasedGiftCardId },
        "Email template not found, skipping",
      );
      return;
    }

    if (emailTemplate.type !== "email") {
      logger.debug(
        { appId: appData._id, purchasedGiftCardId },
        "Email template is not an email template, skipping",
      );
      return;
    }

    if (emailTemplate.type !== "email") {
      logger.debug(
        { appId: appData._id, purchasedGiftCardId },
        "Email template is not an email template, skipping",
      );
      return;
    }

    const args = await this.getEmailTemplateArguments(
      appData,
      purchasedGiftCard,
    );

    const subject = templateSafeWithError(emailTemplate.subject, args);
    const renderedTemplate = await renderToStaticMarkup({
      args,
      document: emailTemplate.value,
    });

    const updatedPurchasedGiftCard =
      await this.repository.getPurchasedGiftCardReadyToSendEmails(
        purchasedGiftCardId,
        "customer",
      );

    if (!updatedPurchasedGiftCard) {
      logger.debug(
        { appId: appData._id, purchasedGiftCardId },
        "Purchased gift card not ready to send emails",
      );
      return;
    }

    const giftCardPdfFileName = getFileName(
      appData._id,
      purchasedGiftCardId,
      "gift-card",
      "pdf",
    );

    const invoicePdfFileName = getFileName(
      appData._id,
      purchasedGiftCardId,
      "invoice",
      "pdf",
    );

    await this.services.notificationService.sendEmail({
      email: {
        to: customer.email,
        subject,
        body: renderedTemplate,
        attachments: [
          {
            filename: "invoice.pdf",
            contentType: "application/pdf",
            storageFilename: invoicePdfFileName,
            cid: "invoice-pdf",
          },
          {
            filename: "gift-card.pdf",
            contentType: "application/pdf",
            storageFilename: giftCardPdfFileName,
            cid: "gift-card-pdf",
          },
        ],
      },
      participantType: "customer",
      handledBy: {
        key: "app_gift-card-studio_admin.handlers.send-email-to-customer" satisfies GiftCardStudioAdminAllKeys,
        args: {
          name: customer.name,
        },
      },
    });

    logger.debug(
      { appId: appData._id, purchasedGiftCardId },
      "Successfully sent email to customer",
    );
  }

  private async getEmailTemplateArguments(
    appData: ConnectedAppData,
    purchasedGiftCard: PurchasedGiftCardListModel,
  ): Promise<Args<null, any>> {
    const config = await this.services.configurationService.getConfigurations(
      "booking",
      "general",
      "brand",
      "social",
    );
    const organization =
      await this.services.organizationService.getOrganization();
    if (!organization) {
      throw new Error("Organization not found");
    }

    const adminUrl = getAdminUrl();
    const websiteUrl = getWebsiteUrl(organization);

    const { customer, ...giftCard } = purchasedGiftCard;

    const result = getArguments({
      appointment: null,
      customer,
      config,
      adminUrl,
      websiteUrl,
      locale: config.brand.language,
      additionalProperties: {
        giftCard,
      },
    });

    return result;
  }
}
