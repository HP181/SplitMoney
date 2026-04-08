interface EmailTemplateProps {
  type: 'created' | 'updated'
  teamName: string
  billName: string
  grandTotal: number
  memberAmount: number
  memberName: string
  billUrl: string
}

export function generateBillEmailHtml(props: EmailTemplateProps): string {
  const { type, teamName, billName, grandTotal, memberAmount, memberName, billUrl } = props

  const isNew = type === 'created'

  const accentColor = isNew ? '#16a34a' : '#2563eb'
  const accentLight = isNew ? '#dcfce7' : '#dbeafe'
  const accentDark = isNew ? '#15803d' : '#1d4ed8'
  const badgeText = isNew ? '🆕 New Bill' : '✏️ Bill Updated'
  const headline = isNew
    ? `You've been added to a new bill`
    : `A bill has been updated`
  const subheadline = isNew
    ? `<strong>${teamName}</strong> has a new expense to split.`
    : `The bill details for <strong>${teamName}</strong> have changed.`
  const ctaText = isNew ? 'View Bill & Assignments' : 'View Updated Bill'

  const percentOfTotal =
    grandTotal > 0 ? Math.round((memberAmount / grandTotal) * 100) : 0

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${isNew ? 'New Bill' : 'Bill Updated'} — SplitMoney</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

  <!-- Outer wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f5;padding:40px 16px;">
    <tr>
      <td align="center">

        <!-- Card -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header bar -->
          <tr>
            <td style="background:${accentColor};padding:32px 40px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <p style="margin:0 0 8px;font-size:13px;font-weight:600;letter-spacing:0.08em;color:rgba(255,255,255,0.8);text-transform:uppercase;">${badgeText}</p>
                    <h1 style="margin:0;font-size:26px;font-weight:700;color:#ffffff;line-height:1.2;">${headline}</h1>
                    <p style="margin:10px 0 0;font-size:15px;color:rgba(255,255,255,0.85);">${subheadline}</p>
                  </td>
                  <td align="right" valign="top" style="padding-left:16px;">
                    <div style="width:48px;height:48px;background:rgba(255,255,255,0.2);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:24px;line-height:48px;text-align:center;">
                      💸
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:32px 40px 0;">
              <p style="margin:0;font-size:16px;color:#374151;line-height:1.6;">
                Hi <strong>${memberName}</strong>,
              </p>
              <p style="margin:12px 0 0;font-size:15px;color:#6b7280;line-height:1.6;">
                ${isNew
                  ? `A new bill called <strong style="color:#111827;">"${billName}"</strong> has been created in your team <strong style="color:#111827;">${teamName}</strong>. Here's your share of the expense:`
                  : `The bill <strong style="color:#111827;">"${billName}"</strong> in <strong style="color:#111827;">${teamName}</strong> has been updated. Your new share is:`
                }
              </p>
            </td>
          </tr>

          <!-- Amount card -->
          <tr>
            <td style="padding:24px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${accentLight};border-radius:12px;overflow:hidden;">
                <tr>
                  <td style="padding:24px 28px;">
                    <p style="margin:0 0 4px;font-size:12px;font-weight:600;letter-spacing:0.08em;color:${accentColor};text-transform:uppercase;">Your share</p>
                    <p style="margin:0;font-size:42px;font-weight:800;color:${accentDark};letter-spacing:-1px;">$${memberAmount.toFixed(2)}</p>
                    <p style="margin:8px 0 0;font-size:13px;color:#6b7280;">
                      ${percentOfTotal}% of the total bill · Bill total: <strong>$${grandTotal.toFixed(2)}</strong>
                    </p>

                    <!-- Progress bar -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:16px;">
                      <tr>
                        <td style="background:rgba(255,255,255,0.6);border-radius:99px;height:8px;overflow:hidden;">
                          <div style="width:${percentOfTotal}%;height:8px;background:${accentColor};border-radius:99px;"></div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Bill info row -->
          <tr>
            <td style="padding:0 40px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e5e7eb;border-radius:10px;">
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="font-size:13px;color:#6b7280;">Bill name</td>
                        <td align="right" style="font-size:13px;font-weight:600;color:#111827;">${billName}</td>
                      </tr>
                    </table>
                  </td>
                  <td style="display:none;"></td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="font-size:13px;color:#6b7280;">Team</td>
                        <td align="right" style="font-size:13px;font-weight:600;color:#111827;">${teamName}</td>
                      </tr>
                    </table>
                  </td>
                  <td style="display:none;"></td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="font-size:13px;color:#6b7280;">Bill total (incl. tax)</td>
                        <td align="right" style="font-size:13px;font-weight:600;color:#111827;">$${grandTotal.toFixed(2)}</td>
                      </tr>
                    </table>
                  </td>
                  <td style="display:none;"></td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA button -->
          <tr>
            <td style="padding:0 40px 36px;" align="center">
              <a href="${billUrl}"
                style="display:inline-block;background:${accentColor};color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 32px;border-radius:8px;letter-spacing:0.01em;">
                ${ctaText} →
              </a>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <div style="border-top:1px solid #f3f4f6;"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px 32px;">
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;text-align:center;">
                You're receiving this because you're a member of <strong>${teamName}</strong> on SplitMoney.<br/>
                Log in to <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" style="color:#6b7280;">your dashboard</a> to view all your bills.
              </p>
              <p style="margin:12px 0 0;font-size:12px;color:#d1d5db;text-align:center;">
                © ${new Date().getFullYear()} SplitMoney · Stop doing math at the dinner table.
              </p>
            </td>
          </tr>

        </table>
        <!-- End card -->

      </td>
    </tr>
  </table>

</body>
</html>`
}