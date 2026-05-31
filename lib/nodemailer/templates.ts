const escapeHtml = (str: string): string =>
  str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const appUrl = () => process.env.BETTER_AUTH_URL || "http://localhost:3000";

// ============================================================
// Welcome email (Step 3) — unchanged
// ============================================================

type WelcomeEmailArgs = {
  name: string;
  aiContent: string;
};

export const welcomeEmailTemplate = ({ name, aiContent }: WelcomeEmailArgs) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Welcome to Stockwood</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f4f4f5; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06);">

          <tr>
            <td style="padding: 40px 40px 32px; border-bottom: 1px solid #f4f4f5;">
              <div style="display: inline-block; vertical-align: middle;">
                <span style="display: inline-block; width: 36px; height: 36px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 10px; vertical-align: middle; text-align: center; line-height: 36px; color: #ffffff; font-weight: 800; font-size: 18px; margin-right: 12px;">S</span>
                <span style="font-size: 22px; font-weight: 700; color: #18181b; letter-spacing: -0.5px; vertical-align: middle;">Stockwood</span>
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px 40px 8px;">
              <div style="display: inline-block; padding: 6px 12px; background-color: #ecfdf5; border-radius: 999px; margin-bottom: 16px;">
                <span style="color: #047857; font-size: 12px; font-weight: 600; letter-spacing: 0.3px; text-transform: uppercase;">Welcome aboard</span>
              </div>
              <h1 style="margin: 0; font-size: 30px; font-weight: 700; color: #09090b; letter-spacing: -0.75px; line-height: 1.2;">Hi ${escapeHtml(name)},</h1>
              <p style="margin: 8px 0 0; font-size: 16px; color: #71717a; line-height: 1.5;">Your personalized market intelligence starts now.</p>
            </td>
          </tr>

          <tr>
            <td style="padding: 24px 40px 32px;">
              <div style="font-size: 16px; line-height: 1.75; color: #3f3f46; white-space: pre-wrap;">${escapeHtml(aiContent)}</div>
            </td>
          </tr>

          <tr>
            <td style="padding: 0 40px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${appUrl()}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 10px; font-weight: 600; font-size: 15px; letter-spacing: 0.2px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                      Open Stockwood &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 0 40px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #fafafa; border-radius: 12px; padding: 24px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 12px; font-size: 12px; font-weight: 700; color: #71717a; text-transform: uppercase; letter-spacing: 0.6px;">What's next</p>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr><td style="padding: 8px 0;"><span style="color: #10b981; font-weight: 700; margin-right: 8px;">&#10003;</span><span style="color: #3f3f46; font-size: 14px;">Add stocks to your personal watchlist</span></td></tr>
                      <tr><td style="padding: 8px 0;"><span style="color: #10b981; font-weight: 700; margin-right: 8px;">&#10003;</span><span style="color: #3f3f46; font-size: 14px;">Get AI-curated news digests daily</span></td></tr>
                      <tr><td style="padding: 8px 0;"><span style="color: #10b981; font-weight: 700; margin-right: 8px;">&#10003;</span><span style="color: #3f3f46; font-size: 14px;">Explore market trends matched to your goals</span></td></tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="background-color: #fafafa; padding: 24px 40px; text-align: center; border-top: 1px solid #f4f4f5;">
              <p style="margin: 0 0 4px; font-size: 13px; color: #52525b; font-weight: 600;">Stockwood</p>
              <p style="color: #a1a1aa; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} Stockwood. AI-powered market intelligence.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
};

// ============================================================
// Daily digest email (Step 4) — new
// ============================================================

type DigestArticle = {
  headline: string;
  source: string;
  summary: string;
  url: string;
  datetime: number; // unix seconds (from Finnhub)
};

type DailyDigestArgs = {
  name: string;
  aiSummary: string;
  articles: DigestArticle[];
  isWatchlistBased: boolean;
};

const truncate = (str: string, max: number) =>
  str.length > max ? str.slice(0, max).trim() + "…" : str;

const formatDate = (unixSeconds: number) =>
  new Date(unixSeconds * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

const renderArticle = (article: DigestArticle) => `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid #f4f4f5;">
    <tr>
      <td>
        <a href="${escapeHtml(article.url)}" style="text-decoration: none; color: inherit;">
          <h3 style="margin: 0 0 8px; font-size: 17px; font-weight: 700; color: #09090b; line-height: 1.4;">
            ${escapeHtml(article.headline)}
          </h3>
        </a>
        <p style="margin: 0 0 12px; font-size: 11px; color: #71717a; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
          ${escapeHtml(article.source)} &nbsp;·&nbsp; ${formatDate(article.datetime)}
        </p>
        <p style="margin: 0 0 12px; font-size: 14px; color: #52525b; line-height: 1.6;">
          ${escapeHtml(truncate(article.summary, 220))}
        </p>
        <a href="${escapeHtml(article.url)}" style="color: #059669; font-size: 13px; font-weight: 600; text-decoration: none;">
          Read article &rarr;
        </a>
      </td>
    </tr>
  </table>
`;

export const dailyDigestTemplate = ({
  name,
  aiSummary,
  articles,
  isWatchlistBased,
}: DailyDigestArgs) => {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const sourceLabel = isWatchlistBased
    ? "From your watchlist"
    : "Today's market";

  const articlesHtml = articles.map(renderArticle).join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Stockwood Daily Digest</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f4f4f5; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06);">

          <!-- Header -->
          <tr>
            <td style="padding: 32px 40px 24px; border-bottom: 1px solid #f4f4f5;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="vertical-align: middle;">
                    <span style="display: inline-block; width: 32px; height: 32px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 8px; vertical-align: middle; text-align: center; line-height: 32px; color: #ffffff; font-weight: 800; font-size: 15px; margin-right: 10px;">S</span>
                    <span style="font-size: 18px; font-weight: 700; color: #18181b; letter-spacing: -0.4px; vertical-align: middle;">Stockwood</span>
                  </td>
                  <td style="text-align: right; vertical-align: middle;">
                    <span style="font-size: 12px; color: #71717a; font-weight: 500;">${today}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 36px 40px 12px;">
              <div style="display: inline-block; padding: 5px 12px; background-color: #ecfdf5; border-radius: 999px; margin-bottom: 14px;">
                <span style="color: #047857; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase;">Daily Digest · ${sourceLabel}</span>
              </div>
              <h1 style="margin: 0; font-size: 26px; font-weight: 700; color: #09090b; letter-spacing: -0.5px; line-height: 1.25;">Good morning, ${escapeHtml(name)}</h1>
            </td>
          </tr>

          <!-- AI Summary -->
          <tr>
            <td style="padding: 16px 40px 28px;">
              <div style="background-color: #fafafa; border-left: 3px solid #10b981; border-radius: 8px; padding: 20px 22px;">
                <p style="margin: 0 0 8px; font-size: 11px; font-weight: 700; color: #047857; text-transform: uppercase; letter-spacing: 0.6px;">AI Summary</p>
                <div style="font-size: 15px; line-height: 1.7; color: #27272a; white-space: pre-wrap;">${escapeHtml(aiSummary)}</div>
              </div>
            </td>
          </tr>

          <!-- Articles -->
          <tr>
            <td style="padding: 0 40px 8px;">
              <p style="margin: 0 0 24px; font-size: 12px; font-weight: 700; color: #71717a; text-transform: uppercase; letter-spacing: 0.6px;">Top Stories</p>
              ${articlesHtml}
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 8px 40px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${appUrl()}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 13px 32px; border-radius: 10px; font-weight: 600; font-size: 14px; letter-spacing: 0.2px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                      Open Stockwood &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #fafafa; padding: 24px 40px; text-align: center; border-top: 1px solid #f4f4f5;">
              <p style="margin: 0 0 4px; font-size: 13px; color: #52525b; font-weight: 600;">Stockwood Daily Digest</p>
              <p style="color: #a1a1aa; font-size: 11px; margin: 0 0 8px;">&copy; ${new Date().getFullYear()} Stockwood. AI-powered market intelligence.</p>
              <p style="color: #a1a1aa; font-size: 11px; margin: 0;">
                You're getting this because you opted in. Manage preferences in <a href="${appUrl()}" style="color: #71717a; text-decoration: underline;">your account</a>.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
};