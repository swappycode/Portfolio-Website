import { Router } from "express";
import {List,Detail} from "../controllers/project.controllers.js";



const gitRouter = Router();

gitRouter.get('/List',List);

gitRouter.get('/Detail',Detail);

export default gitRouter;