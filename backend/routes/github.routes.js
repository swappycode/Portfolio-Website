import { Router } from "express";
import {gList,gDetail} from "../controllers/github.controller.js";



const gitRouter = Router();

gitRouter.get('/',gList);

gitRouter.get('/:name',gDetail);

export default gitRouter;