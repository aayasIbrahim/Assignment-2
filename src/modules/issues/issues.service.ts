import { pool } from "../../db";
import type { RUser, User } from "../../types";
import type {
  IIssuePayload,
  IIssueQueryParams,
  IIssueRow,
  IReporter,
  IReporterMap,
} from "./issues.interface";
import type { TIssue } from "./issues.interface";
type TRole = "maintainer" | "contributor";

const createIssuesIntoDB = async (
  payload: IIssuePayload,
  reporterId: number | string,
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
export const updateIssuesFromDB = async (
  issueId: string,
  // Accepts a partial object of TIssue, allowing individual fields to be updated optionally
  payload: Partial<TIssue>,
  user: {
    id: number | string;
    role: TRole;
  },
) => {
  // Find existing issue
  const existingIssue = await pool.query(`SELECT * FROM issues WHERE id = $1`, [
    issueId,
  ]);

  const issue = existingIssue.rows[0];

  if (!issue) {
    throw new Error("Issue not found");
  }

  /**
   * Authorization Rules
   *
   * Maintainer:
   * - Can update any issue
   *
   * Contributor:
   * - Can update only own issue
   * - Issue status must be open
   */

  if (user.role === "contributor") {
    // Own issue check
    if (issue.reporter_id !== user.id) {
      throw new Error("You are not authorized");
    }

    // Status check
    if (issue.status !== "open") {
      throw new Error("You can only update issue when status is open");
    }
  }

  // Prevent updating restricted fields
  delete payload.id;
  delete payload.created_at;
  delete payload.updated_at;
  delete payload.reporter_id;

  // Validation
  if (payload.title && payload.title.length > 150) {
    throw new Error("Title cannot exceed 150 characters");
  }

  if (payload.description && payload.description.length < 20) {
    throw new Error("Description must be at least 20 characters");
  }

  if (payload.type && !["bug", "feature_request"].includes(payload.type)) {
    throw new Error("Invalid issue type");
  }

  if (
    payload.status &&
    !["open", "in_progress", "resolved"].includes(payload.status)
  ) {
    throw new Error("Invalid status");
  }

  // Dynamic update
  const fields = Object.keys(payload);

  if (fields.length === 0) {
    throw new Error("No update data provided");
  }
  // dynamic SQL SET clause তৈরি করা (যেমন: payload-এ title ও status থাকলে তৈরি হবে: "title = $1, status = $2")

  const setClause = fields
    .map((field, index) => `${field} = $${index + 1}`)
    .join(", ");

  const values = [
    ...fields.map((field) => payload[field as keyof TIssue]),
    issueId,
  ];

  const query = `
    UPDATE issues
    SET ${setClause}
    WHERE id = $${fields.length + 1}
    RETURNING *;
  `;

  const result = await pool.query(query, values);

  return result.rows[0];
};

const deleteIssueFromDB = async (id: string) => {
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
  updateIssuesFromDB,
  deleteIssueFromDB,
};
