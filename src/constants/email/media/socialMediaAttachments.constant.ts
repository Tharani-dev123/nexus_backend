import { getInlineAttachment } from "../../../utils/email/getLogoAttachement.util.js";

const FCXlogo = await getInlineAttachment("FCX-logo.png", "logo");
const instaLogo = await getInlineAttachment("instagram.png", "instagram");
const linkedinLogo = await getInlineAttachment("linkedin.png", "linkedin");
const youtubeLogo = await getInlineAttachment("youtube.png", "youtube");
const facebookLogo = await getInlineAttachment("facebook.png", "facebook");
const twitterLogo = await getInlineAttachment("twitter.png", "twitter");

const SOCIAL_MEDIA_ATTACHMENTS = [
  FCXlogo,
  instaLogo,
  linkedinLogo,
  youtubeLogo,
  facebookLogo,
  twitterLogo,
];

export default SOCIAL_MEDIA_ATTACHMENTS;
