import { pool } from "../../db";
import type {
  IIssuePayload,
  IIssueQueryParams,
  IIssueRow,
  IReporter,
  IReporterMap,
} from "./issues.interface";

const createIssuesIntoDB = async (
  payload: IIssuePayload,
  reporterId: number,
) => {
  const { title, description, type } = payload;
  const result = await pool.query(
    `
    INSERT INTO issues (title, description, type, reporter_id)
    VALUES ($1, $2, $3, $4)
    RETURNING id, title, description, type, status, reporter_id, created_at, updated_at
    `,
    [title, description, type, reporterId],
  );

  return result;
};
const getAllIssuesFromDB = async (queryParams: IIssueQueryParams) => {
  const { sort = "newest", type, status } = queryParams;

  // ১. ডাইনামিক বেস কুয়েরি তৈরি
  let queryText = `SELECT * FROM issues WHERE 1=1`;
  const values: (string | number)[] = [];
  let paramIndex = 1;

  // ইউজার ফিল্টার পাঠালে তা যুক্ত হবে
  if (type) {
    queryText += ` AND type = $${paramIndex}`;
    values.push(type);
    paramIndex++;
  }
  if (status) {
    queryText += ` AND status = $${paramIndex}`;
    values.push(status);
    paramIndex++;
  }

  // সোর্টিং কন্ডিশন
  queryText +=
    sort === "oldest"
      ? ` ORDER BY created_at ASC`
      : ` ORDER BY created_at DESC`;

  // ২. সব ইস্যু ডাটাবেজ থেকে তুলে আনা
  const result = await pool.query(queryText, values);
  const issues = result.rows;

  if (issues.length === 0) return [];

  // ৩. 🎯 JOIN ছাড়া রিপোর্টারের ডাটা ব্যাচ আকারে নিয়ে আসার চ্যালেঞ্জ
  // সব ইস্যু থেকে ইউনিক reporter_id গুলোর একটি অ্যারে তৈরি
  const reporterIds = Array.from(
    new Set(issues.map((issue) => issue.reporter_id)),
  );

  // এক কুয়েরিতে সব রিপোর্টার তুলে আনা
  const reportersResult = await pool.query(
    `SELECT id, name, role FROM users WHERE id = ANY($1)`,
    [reporterIds],
  );

  // দ্রুত আইডি দিয়ে খোঁজার জন্য অবজেক্ট ম্যাপ তৈরি
  const reporterMap = reportersResult.rows.reduce<IReporterMap>(
    (acc, reporter) => {
      acc[reporter.id] = reporter;
      return acc;
    },
    {},
  );

  // ৪. ইস্যুর ডাটার সাথে রিপোর্টার অবজেক্ট ম্যাপ করা এবং অতিরিক্ত reporter_id ফিল্ড বাদ দেওয়া
  return issues.map((issue) => {
    const { reporter_id, ...issueData } = issue;
    return {
      ...issueData,
      reporter: reporterMap[reporter_id] || null,
    };
  });
};
const getSingleIssuesFromDB = async (id: string) => {
  const issueResult = await pool.query<IIssueRow>(
    `SELECT * FROM issues WHERE id = $1`,
    [id],
  );

  if (issueResult.rows.length === 0) {
    return null;
  }

  const issue = issueResult.rows[0] as IIssueRow;

  // ২. 🎯 JOIN ছাড়া এই ইস্যুর রিপোর্টারের ডাটা আলাদা কুয়েরিতে তুলে আনা
  const reporterResult = await pool.query<IReporter>(
    `SELECT id, name, role FROM users WHERE id = $1`,
    [issue.reporter_id],
  );

  const reporter = reporterResult.rows[0] || null;

  // ৩. রেসপন্স ফরম্যাট অনুযায়ী reporter_id বাদ দিয়ে নতুন অবজেক্ট রিটার্ন করা
  const { reporter_id, ...issueData } = issue;

  return {
    ...issueData,
    reporter: reporter,
  };
};

const deleteIssueFromDB = async(id:string) => {
 const result = await pool.query(
    `
    DELETE FROM issues WHERE id=$1  
      `,
    [id],
  );
  return result;
};
export const issuesService = {
  createIssuesIntoDB,
  getAllIssuesFromDB,
  getSingleIssuesFromDB,
  deleteIssueFromDB,
};
