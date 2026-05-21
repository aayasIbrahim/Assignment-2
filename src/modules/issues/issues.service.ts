import { pool } from "../../db";

const createIssuesIntoDB = async (
  payload: {
    title: string;
    description: string;
    type: "bug" | "feature_request";
  },
  reporterId: string,
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
const getIssuesFromDB = async (queryParams: { sort?: string; type?: string; status?: string }) => {
  
  const { sort = 'newest', type, status } = queryParams;
  
  // ১. ডাইনামিক বেস কুয়েরি তৈরি
  let queryText = `SELECT * FROM issues WHERE 1=1`;
  const values: any[] = [];
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
  queryText += sort === 'oldest' ? ` ORDER BY created_at ASC` : ` ORDER BY created_at DESC`;

  // ২. সব ইস্যু ডাটাবেজ থেকে তুলে আনা
  const result = await pool.query(queryText, values);
  const issues = result.rows;

  if (issues.length === 0) return [];

  // ৩. 🎯 JOIN ছাড়া রিপোর্টারের ডাটা ব্যাচ আকারে নিয়ে আসার চ্যালেঞ্জ
  // সব ইস্যু থেকে ইউনিক reporter_id গুলোর একটি অ্যারে তৈরি
  const reporterIds = Array.from(new Set(issues.map(issue => issue.reporter_id)));
  
  // এক কুয়েরিতে সব রিপোর্টার তুলে আনা
  const reportersResult = await pool.query(
    `SELECT id, name, role FROM users WHERE id = ANY($1)`, 
    [reporterIds]
  );
  
  // দ্রুত আইডি দিয়ে খোঁজার জন্য অবজেক্ট ম্যাপ তৈরি
  const reporterMap = reportersResult.rows.reduce((acc: any, reporter: any) => {
    acc[reporter.id] = reporter;
    return acc;
  }, {});

  // ৪. ইস্যুর ডাটার সাথে রিপোর্টার অবজেক্ট ম্যাপ করা এবং অতিরিক্ত reporter_id ফিল্ড বাদ দেওয়া
  return issues.map(issue => {
    const { reporter_id, ...issueData } = issue;
    return {
      ...issueData,
      reporter: reporterMap[reporter_id] || null
    };
  });
};
export const issuesService = {
  createIssuesIntoDB,
  getIssuesFromDB,
};
