// One place that decides where a person should go.
//
//  not signed in            -> /login
//  waiting for the manager  -> /waiting-approval   (normal waiting page)
//  admin                    -> /admin/dashboard
//  manager                  -> /manager/dashboard
//  sales                    -> /sales/dashboard
export const getHomePath = (user) => {
  if (!user) return "/login";

  if (user.status === "pending") return "/waiting-approval";

  if (user.role === "admin") return "/admin/dashboard";
  if (user.role === "sales") return "/sales/dashboard";
  if (user.role === "manager") return "/manager/dashboard";

  return "/login";
};