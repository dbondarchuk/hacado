import { ReaderProps, templateProps } from "@timelish/builder";
import { OnlineMeetingProps, OnlineMeetingPropsDefaults } from "./schema";
import { getLogoUrl, getStyles } from "./styles";

export const OnlineMeetingReader = ({
  props,
  style,
  isEditor,
  args,
}: ReaderProps<OnlineMeetingProps>) => {
  if (!isEditor && !args.meetingInformation) {
    return null;
  }

  const meetingInformation = args.meetingInformation ?? {
    type: "google_meet",
    meetingId: "1234567890",
    meetingPassword: "1234567890",
    url: "https://meet.google.com/1234567890",
  };

  const values = templateProps(
    {
      title: props?.title ?? OnlineMeetingPropsDefaults.props.title,
      whenText: props?.whenText ?? OnlineMeetingPropsDefaults.props.whenText,
      codeText: props?.codeText ?? OnlineMeetingPropsDefaults.props.codeText,
      passwordText:
        props?.passwordText ?? OnlineMeetingPropsDefaults.props.passwordText,
      buttonText:
        props?.buttonText ?? OnlineMeetingPropsDefaults.props.buttonText,
      linkText: props?.linkText ?? OnlineMeetingPropsDefaults.props.linkText,
      buttonTextColor:
        props?.buttonTextColor ??
        OnlineMeetingPropsDefaults.props.buttonTextColor,
      buttonBackgroundColor:
        props?.buttonBackgroundColor ??
        OnlineMeetingPropsDefaults.props.buttonBackgroundColor,
      type: props?.type ?? OnlineMeetingPropsDefaults.props.type,
      logoUrl: getLogoUrl(props),
    },
    args,
  );

  const {
    title,
    whenText,
    codeText,
    passwordText,
    buttonText,
    linkText,
    buttonTextColor,
    buttonBackgroundColor,
    type,
    logoUrl,
  } = values;

  const styles = getStyles({ props, style });

  return (
    <table
      role="presentation"
      cellPadding={0}
      cellSpacing={0}
      width="100%"
      style={{
        margin: "0 auto",
        fontFamily:
          styles.fontFamily ??
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      <tbody>
        <tr>
          <td style={{ padding: "18px" }}>
            {/* Card */}
            <table
              role="presentation"
              cellPadding={0}
              cellSpacing={0}
              width="100%"
              style={{
                borderRadius: "12px",
                overflow: "hidden",
                border: "1px solid #e6e6e6",
              }}
            >
              <tbody>
                <tr>
                  <td
                    style={{
                      backgroundColor: styles.backgroundColor ?? "#FBF9F3",
                      padding: "18px",
                    }}
                  >
                    {/* Row */}
                    <table
                      role="presentation"
                      cellPadding={0}
                      cellSpacing={0}
                      width="100%"
                    >
                      <tbody>
                        <tr>
                          {/* Left: Logo */}
                          <td
                            width="84px"
                            valign="top"
                            style={{ paddingRight: "12px" }}
                          >
                            {/* Replace src with your hosted logo (PNG/JPG). Add width/height attributes for better rendering. */}
                            <img
                              src={logoUrl}
                              alt="Meeting"
                              height="64px"
                              style={{
                                display: "block",
                                border: 0,
                                outline: "none",
                                textDecoration: "none",
                                borderRadius: "8px",
                                background: "#f6f8fb",
                              }}
                            />
                          </td>
                          {/* Right: Details */}
                          <td valign="top" style={{ paddingLeft: "0px" }}>
                            <table
                              role="presentation"
                              cellPadding={0}
                              cellSpacing={0}
                              width="100%"
                            >
                              <tbody>
                                <tr>
                                  <td
                                    style={{
                                      fontSize: "16px",
                                      lineHeight: "20px",
                                      color: "#111827",
                                      fontWeight: 600,
                                      paddingBottom: "4px",
                                    }}
                                  >
                                    {title}
                                  </td>
                                </tr>
                                <tr>
                                  <td
                                    style={{
                                      fontSize: "13px",
                                      lineHeight: "18px",
                                      color: "#6b7280",
                                      paddingBottom: "12px",
                                    }}
                                  >
                                    <strong>{whenText}</strong>{" "}
                                    {args.dateTime.full}
                                    <br />
                                    <strong>{codeText}</strong>{" "}
                                    <span
                                      style={{
                                        fontFamily: "monospace",
                                        background: "#f3f4f6",
                                        padding: "2px 6px",
                                        borderRadius: "4px",
                                        fontSize: "13px",
                                      }}
                                    >
                                      {meetingInformation.meetingId}
                                    </span>
                                    {meetingInformation.meetingPassword && (
                                      <>
                                        <br />
                                        <strong>{passwordText}</strong>{" "}
                                        <span
                                          style={{
                                            fontFamily: "monospace",
                                            background: "#f3f4f6",
                                            padding: "2px 6px",
                                            borderRadius: "4px",
                                            fontSize: "13px",
                                          }}
                                        >
                                          {meetingInformation.meetingPassword}
                                        </span>
                                      </>
                                    )}
                                  </td>
                                </tr>
                                <tr>
                                  <td>
                                    {/* Button: use table button for email clients */}
                                    {/*[if mso]>
                  <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="{{MEET_URL}}" style="height:44px;v-text-anchor:middle;width:200px;" arcsize="10%" strokecolor="#7C8B6F" fillcolor="#7C8B6F">
                    <w:anchorlock/>
                    <center style="color:#FBF9F3;font-family:Arial,sans-serif;font-size:14px;font-weight:600;">Join meeting</center>
                  </v:roundrect>
                  <![endif]*/}
                                    {/* Non-Outlook */}
                                    <table
                                      role="presentation"
                                      cellPadding={0}
                                      cellSpacing={0}
                                      style={{ display: "inline-block" }}
                                    >
                                      <tbody>
                                        <tr>
                                          <td
                                            align="center"
                                            style={{
                                              backgroundColor:
                                                buttonBackgroundColor ??
                                                "#7C8B6F",
                                              borderRadius: "8px",
                                            }}
                                          >
                                            <a
                                              href={meetingInformation.url}
                                              target="_blank"
                                              style={{
                                                display: "inline-block",
                                                padding: "12px 20px",
                                                fontSize: "14px",
                                                fontWeight: 600,
                                                color:
                                                  buttonTextColor ?? "#FBF9F3",
                                                textDecoration: "none",
                                                borderRadius: "8px",
                                                lineHeight: "16px",
                                              }}
                                            >
                                              {/* Optionally include a tiny icon before text (use hosted PNG) */}
                                              <img
                                                src={logoUrl}
                                                alt=""
                                                style={{
                                                  verticalAlign: "middle",
                                                  marginRight: "8px",
                                                  border: 0,
                                                  outline: "none",
                                                  display: "inline-block",
                                                  height: "16px",
                                                }}
                                              />
                                              {buttonText}
                                            </a>
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                    {/* Small fallback / secondary link */}
                                    <div
                                      style={{
                                        marginTop: "10px",
                                        fontSize: "12px",
                                        color: "#9ca3af",
                                      }}
                                    >
                                      {linkText}
                                      <div
                                        style={{
                                          wordBreak: "break-all",
                                          color:
                                            buttonBackgroundColor ?? "#7C8B6F",
                                          fontSize: "13px",
                                          paddingTop: "6px",
                                        }}
                                      >
                                        <a
                                          href={meetingInformation.url}
                                          target="_blank"
                                          style={{
                                            color:
                                              buttonBackgroundColor ??
                                              "#7C8B6F",
                                            textDecoration: "underline",
                                          }}
                                        >
                                          {meetingInformation.url}
                                        </a>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    {/* End row */}
                  </td>
                </tr>
              </tbody>
            </table>
            {/* End card */}
          </td>
        </tr>
      </tbody>
    </table>
  );
};
