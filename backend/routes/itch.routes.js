import { Router } from "express";
import {iList,iDetail} from "../controllers/itch.controller.js";

const itchRouter = Router();

itchRouter.get('/',iList);

itchRouter.get('/:slug',iDetail);

export default itchRouter;