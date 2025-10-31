import serverless from "serverless-http";
import { createServer } from "../server/index.ts";

export default serverless(createServer());
