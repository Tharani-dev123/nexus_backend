import { enqueueNotification } from "./queue.service.js";
import { processQueue } from "./worker.service.js";

const NOTIFICATION_SERVICE = {
  enqueueNotification,
  processQueue,
};

export default NOTIFICATION_SERVICE;
export { enqueueNotification, processQueue };
