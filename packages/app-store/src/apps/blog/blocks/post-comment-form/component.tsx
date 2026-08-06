"use client";

import { clientApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import {
  BlockStyle,
  generateClassName,
} from "@hacado/page-builder-base/reader";
import { zNonEmptyString } from "@hacado/types";
import {
  Button,
  cn,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Spinner,
  Textarea,
  toast,
} from "@hacado/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { BlogPost } from "../../models";
import {
  BlogPublicKeys,
  BlogPublicNamespace,
  blogPublicNamespace,
} from "../../translations/types";
import { useCommentsPagination } from "../comments-container/comments-pagination-context";
import { requestBlogCommentsRefetch } from "../comments-container/comments-refetch";
import {
  BlogPostCommentFormDisplayConfig,
  BlogPostCommentFormProps,
  styles,
} from "./schema";

type BlogPostCommentFormComponentProps = {
  post: BlogPost | null;
  appId: string;
  display: BlogPostCommentFormDisplayConfig;
  style: BlogPostCommentFormProps["style"];
  blockBase?: { className?: string; id?: string };
  isEditor?: boolean;
  overlayProps?: Record<string, unknown>;
};

export const BlogPostCommentFormComponent = ({
  post,
  appId,
  display,
  style,
  blockBase,
  isEditor,
  overlayProps,
}: BlogPostCommentFormComponentProps) => {
  const t = useI18n<BlogPublicNamespace, BlogPublicKeys>(blogPublicNamespace);
  const commentsPagination = useCommentsPagination();
  const className = generateClassName();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const formSchema = useMemo(
    () =>
      z.object({
        authorName: zNonEmptyString(
          t("block.postCommentForm.validation.name.required"),
          1,
          256,
          t("block.postCommentForm.validation.name.max"),
        ),
        authorEmail: z
          .email(t("block.postCommentForm.validation.email.invalid"))
          .min(1, t("block.postCommentForm.validation.email.required"))
          .max(256, t("block.postCommentForm.validation.email.max")),
        body: zNonEmptyString(
          t("block.postCommentForm.validation.body.required"),
          1,
          2048,
          t("block.postCommentForm.validation.body.max"),
        ),
      }),
    [t],
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      authorName: "",
      authorEmail: "",
      body: "",
    },
  });

  if (!post) {
    return (
      <>
        <BlockStyle name={className} styleDefinitions={styles} styles={style} />
        <p
          className={cn(
            className,
            "text-muted-foreground text-sm",
            blockBase?.className,
          )}
        >
          {t("notInBlogContext")}
        </p>
      </>
    );
  }

  if (!display.commentsEnabled) {
    return (
      <>
        <BlockStyle name={className} styleDefinitions={styles} styles={style} />
        <p
          className={cn(
            className,
            "text-muted-foreground text-sm",
            blockBase?.className,
          )}
        >
          {t("block.postCommentForm.disabled")}
        </p>
      </>
    );
  }

  if (submitted) {
    return (
      <>
        <BlockStyle name={className} styleDefinitions={styles} styles={style} />
        <p className={cn(className, "text-sm", blockBase?.className)}>
          {display.successMessage}
        </p>
      </>
    );
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (isEditor) {
      return;
    }

    setSubmitting(true);
    try {
      const res = await clientApi.apps.callAppApi<{
        success: boolean;
        pending?: boolean;
        error?: string;
      }>({
        appId,
        path: "comments",
        method: "POST",
        body: {
          postId: post._id,
          ...values,
        },
        parse: "json",
      });

      if (!res.success) {
        toast.error(res.error ?? t("block.postCommentForm.error"));
        return;
      }

      form.reset();
      setSubmitted(true);
      commentsPagination?.setPage(1);
      commentsPagination?.refetch();
      requestBlogCommentsRefetch();
      if (res.pending) {
        toast.success(t("block.postCommentForm.successPending"));
      } else {
        toast.success(t("block.postCommentForm.success"));
      }
    } catch {
      toast.error(t("block.postCommentForm.error"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <BlockStyle
        name={className}
        styleDefinitions={styles}
        styles={style}
        isEditor={isEditor}
      />
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className={cn(
            className,
            "flex flex-col gap-4 w-full",
            blockBase?.className,
          )}
          id={blockBase?.id}
          {...(isEditor ? overlayProps : {})}
        >
          <FormField
            control={form.control}
            name="authorName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{display.nameLabel}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder={display.namePlaceholder}
                    disabled={isEditor || submitting}
                    className="w-full"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="authorEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{display.emailLabel}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    placeholder={display.emailPlaceholder}
                    disabled={isEditor || submitting}
                    className="w-full"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="body"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{display.bodyLabel}</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder={display.bodyPlaceholder}
                    disabled={isEditor || submitting}
                    rows={4}
                    autoResize
                    className="w-full"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            disabled={isEditor || submitting}
            className="w-full"
          >
            {submitting && <Spinner />}
            {display.submitLabel}
          </Button>
        </form>
      </Form>
    </>
  );
};
