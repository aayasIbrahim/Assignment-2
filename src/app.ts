import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import globalErrorHandler from "./middleware/globelErrorHandler.js";
import { userRoute } from "./modules/auth/auth.route.js";
import { issuesRoute } from "./modules/issues/issues.route.js";
import cors from "cors";

const app: Application = express();
// Enable CORS for the local frontend development server and allow secure credentials (e.g., cookies, authorization headers)
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);

// Handle CORS preflight requests for all routes to allow complex HTTP methods (like PUT, DELETE, PATCH)
app.options("*", cors());
// Parse incoming requests with JSON payloads and populate req.body
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "DevPulse Server Running",
    author: "Ayas Ibrahim",
  });
});

app.use("/api/auth", userRoute);
app.use("/api/issues", issuesRoute);

app.use(globalErrorHandler);

export default app;
