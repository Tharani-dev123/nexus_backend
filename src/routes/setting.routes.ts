import { Router } from "express";
import SETTINGS_CONTROLLER from "../controller/setting.controller.js";

const settingRouter = Router();

settingRouter.get("/", SETTINGS_CONTROLLER.GetSettings);
settingRouter.patch("/", SETTINGS_CONTROLLER.UpdateSettings);

export default settingRouter;
