import type { Request, Response } from "express";
import { issuesService } from "./issues.service";
import { sendResponse } from "../../utils/sendResponse";


const createIssues = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const body =req.body
  if (!userId) {
    return sendResponse(res, 401, {
     message: "Unauthorized"
    });
  }
  const result = await issuesService.createIssuesIntoDB(body, userId);
  sendResponse(res, 201, {
    message: "Issue created successfully",
    data: result.rows[0],
  });
};
const getAllIssues = async (req: Request, res: Response) => {
  const result = await issuesService.getAllIssuesFromDB(req.query);
  //   console.log(result);

  sendResponse(res, 200, {
    message: "Iusses Retrived Successfully",
    data: result,
  });
};
const getSingleIssues = async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await issuesService.getSingleIssuesFromDB(id as string);
  // console.log(result);
  sendResponse(res, 200, {
    data: result,
  });
};

const updateIssue = async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req?.user;
  const updatebody = req.body;
  if (!user) {
    throw new Error("Authentication required to update issues");
  }

  const result = await issuesService.updateIssuesFromDB(
    id as string ,
    updatebody,
    user,
  );

  sendResponse(res, 200, {
    message: "Issue updated successfully",
    data: result,
  });
};
const deleteIssues = async (req: Request, res: Response) => {
  const { id } = req.params;
  await issuesService.deleteIssueFromDB(id as string);
  sendResponse(res, 200, {
    message: "Issue deleted successfully",
  });
};
export const issuesController = {
  createIssues,
  getAllIssues,
  getSingleIssues,
  updateIssue,
  deleteIssues,
};
