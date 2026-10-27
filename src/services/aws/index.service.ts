import sendEmail from "./email/sendEmail.service.js";
import sendTemplatedEmail from "./email/sendTemplatedEmail.service.js";
import getObject from "./s3/getObject.service.js";
import deleteObject from "./s3/deleteObject.service.js";
import getUploadPresignedUrl from "./s3/getUploadPresignedUrl.service.js";

const AWS_SERVICE = {
  EMAIL: {
    sendEmail,
    sendTemplatedEmail,
  },
  S3: {
    getObject,
    deleteObject,
    getUploadPresignedUrl
  },
};

export default AWS_SERVICE;
