import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ManagerSidebar from "../../components/manager/ManagerSidebar";
import ManagerTopbar from "../../components/manager/ManagerTopbar";
import ManagerFooter from "../../components/manager/ManagerFooter"

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const [search, setSearch] = useState("");

  const managerName = user?.name || "Manager";
  const institutionName = user?.institutionName || user?.institution?.name || "Your Institution";

  const firstName = managerName.split(" ")[0];

  const currentDate = useMemo(() => {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date());
  }, []);

  

  const menuGroups = [
    {
      title: "OVERVIEW",
      items: [
        {
          name: "Dashboard",
          icon: "dashboard",
        },
        {
          name: "Upload Data",
          icon: "upload",
        },
        {
          name: "AI Analysis",
          icon: "ai",
        },
      ],
    },

    {
      title: "ANALYTICS",
      items: [
        {
          name: "High-Risk Students",
          icon: "risk",
          badge: "87",
        },
        {
          name: "Student Insights",
          icon: "students",
        },
        {
          name: "Behavior Insights",
          icon: "behavior",
        },
        {
          name: "Academic Analytics",
          icon: "academic",
        },
        {
          name: "Attendance Analytics",
          icon: "attendance",
        },
        {
          name: "Financial Impact",
          icon: "financial",
        },
      ],
    },

    {
      title: "WORKSPACE",
      items: [
        {
          name: "Reports",
          icon: "reports",
        },
        {
          name: "Analysis History",
          icon: "history",
        },
        {
          name: "Settings",
          icon: "settings",
        },
      ],
    },
  ];

 

  const handleMenuClick = (item) => {
    setActiveMenu(item.name);

    // Dashboard
    if (item.name === "Dashboard") {
      navigate("/manager/dashboard");
      return;
    }

    // These pages will be created later.
    console.log(`${item.name} page will be created next.`);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  

  const statistics = [
    {
      title: "Total students",
      value: "1,248",
      description: "Students analyzed",
      icon: "students",
      color: "blue",
      trend: "8.2%",
    },
    {
      title: "Students requiring review",
      value: "87",
      description: "Based on risk indicators",
      icon: "alert",
      color: "red",
    },
    {
      title: "Declining performance",
      value: "143",
      description: "Academic trend indicators",
      icon: "trend",
      color: "orange",
    },
    {
      title: "Attendance concerns",
      value: "96",
      description: "Below expected threshold",
      icon: "calendar",
      color: "purple",
    },
    {
      title: "Financial indicators",
      value: "₹12.4L",
      description: "From available financial data",
      icon: "financial",
      color: "green",
    },
  ];


  const attentionItems = [
    {
      title: "Students requiring review",
      description:
        "32 students in Semester 5 show multiple indicators for academic review.",
      action: "Review students",
      icon: "alert",
      color: "red",
    },
    {
      title: "Performance trend detected",
      description:
        "A decline in exam performance appears across 3 departments.",
      action: "Explore insights",
      icon: "trend",
      color: "orange",
    },
    {
      title: "New analysis ready",
      description:
        "Your Semester 5 student analysis report is available to review.",
      action: "View report",
      icon: "reports",
      color: "blue",
    },
  ];


  const recentAnalyses = [
    {
      dataset: "Semester 5",
      id: "AI-0048",
      date: "30 Sep 2026",
      students: "450",
      indicators: "32",
      status: "Completed",
    },
    {
      dataset: "Semester 4",
      id: "AI-0047",
      date: "28 Sep 2026",
      students: "420",
      indicators: "27",
      status: "Completed",
    },
    {
      dataset: "Semester 3",
      id: "AI-0046",
      date: "24 Sep 2026",
      students: "378",
      indicators: "28",
      status: "Completed",
    },
  ];


  const chartData = [
    {
      month: "Apr",
      performance: 72,
      attendance: 79,
    },
    {
      month: "May",
      performance: 75,
      attendance: 82,
    },
    {
      month: "Jun",
      performance: 71,
      attendance: 77,
    },
    {
      month: "Jul",
      performance: 78,
      attendance: 84,
    },
    {
      month: "Aug",
      performance: 76,
      attendance: 80,
    },
    {
      month: "Sep",
      performance: 82,
      attendance: 85,
    },
  ];

  const Icon = ({ type, size = 20 }) => {
    const common = {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 1.8,
      strokeLinecap: "round",
      strokeLinejoin: "round",
    };

    switch (type) {
      case "dashboard":
        return (
          <svg {...common}>
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
        );

      case "upload":
        return (
          <svg {...common}>
            <path d="M12 16V4" />
            <path d="M7 9l5-5 5 5" />
            <path d="M4 20h16" />
          </svg>
        );

      case "ai":
        return (
          <svg {...common}>
            <path d="M12 3l1.4 4.1L17.5 9l-4.1 1.4L12 14.5l-1.4-4.1L6.5 9l4.1-1.9L12 3z" />
            <path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14z" />
          </svg>
        );

      case "risk":
      case "alert":
        return (
          <svg {...common}>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v5" />
            <path d="M12 16h.01" />
          </svg>
        );

      case "students":
        return (
          <svg {...common}>
            <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 00-3-3.87" />
            <path d="M16 3.13a4 4 0 010 7.75" />
          </svg>
        );

      case "behavior":
        return (
          <svg {...common}>
            <path d="M12 3a6 6 0 016 6c0 2.4-1.2 4-2.5 5.3-.9.9-1.5 1.8-1.5 3.7h-4c0-1.9-.6-2.8-1.5-3.7C7.2 13 6 11.4 6 9a6 6 0 016-6z" />
            <path d="M9 21h6" />
            <path d="M10 18h4" />
          </svg>
        );

      case "academic":
        return (
          <svg {...common}>
            <path d="M3 10l9-5 9 5-9 5-9-5z" />
            <path d="M7 12.5V17c2.7 2 7.3 2 10 0v-4.5" />
            <path d="M21 10v6" />
          </svg>
        );

      case "attendance":
      case "calendar":
        return (
          <svg {...common}>
            <rect x="3" y="4" width="18" height="17" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
            <path d="M8 14h2M14 14h2M8 17h2" />
          </svg>
        );

      case "financial":
        return (
          <svg {...common}>
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M3 9h18" />
            <path d="M16 14h2" />
          </svg>
        );

      case "reports":
        return (
          <svg {...common}>
            <path d="M6 3h9l3 3v15H6z" />
            <path d="M14 3v4h4" />
            <path d="M9 12h6M9 16h6" />
          </svg>
        );

      case "history":
        return (
          <svg {...common}>
            <path d="M3 12a9 9 0 109-9 9.3 9.3 0 00-6.4 2.6L3 8" />
            <path d="M3 3v5h5" />
            <path d="M12 7v5l3 2" />
          </svg>
        );

      case "settings":
        return (
          <svg {...common}>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.5V20h-2.5v-.1a1.7 1.7 0 00-1-1.5 1.7 1.7 0 00-1.9.3l-.1.1-1.8-1.8.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.5-1H6v-2.5h.1a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.9l-.1-.1L9 6.7l.1.1a1.7 1.7 0 001.9.3 1.7 1.7 0 001-1.5V5h2.5v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 00-.3 1.9 1.7 1.7 0 001.5 1h.1v2.5h-.1a1.7 1.7 0 00-1.5 1z" />
          </svg>
        );

      case "search":
        return (
          <svg {...common}>
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-4-4" />
          </svg>
        );

      case "bell":
        return (
          <svg {...common}>
            <path d="M18 8a6 6 0 00-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
            <path d="M10 21h4" />
          </svg>
        );

      case "chevron":
        return (
          <svg {...common}>
            <path d="M9 18l6-6-6-6" />
          </svg>
        );

      case "down":
        return (
          <svg {...common}>
            <path d="M6 9l6 6 6-6" />
          </svg>
        );

      case "trend":
        return (
          <svg {...common}>
            <path d="M3 7l6 6 4-4 8 8" />
            <path d="M16 17h5v-5" />
          </svg>
        );

      case "arrow":
        return (
          <svg {...common}>
            <path d="M5 12h13" />
            <path d="M13 6l6 6-6 6" />
          </svg>
        );

      case "help":
        return (
          <svg {...common}>
            <circle cx="12" cy="12" r="9" />
            <path d="M9.5 9a2.5 2.5 0 115 1.3c0 1.7-2.5 1.7-2.5 3.7" />
            <path d="M12 17h.01" />
          </svg>
        );

      case "file":
        return (
          <svg {...common}>
            <path d="M6 3h9l3 3v15H6z" />
            <path d="M14 3v4h4" />
          </svg>
        );

      default:
        return null;
    }
  };


  const getStatStyles = (color) => {
    const styles = {
      blue: {
        bg: "bg-indigo-50",
        text: "text-indigo-500",
      },
      red: {
        bg: "bg-red-50",
        text: "text-red-400",
      },
      orange: {
        bg: "bg-orange-50",
        text: "text-orange-400",
      },
      purple: {
        bg: "bg-purple-50",
        text: "text-purple-500",
      },
      green: {
        bg: "bg-emerald-50",
        text: "text-emerald-500",
      },
    };

    return styles[color] || styles.blue;
  };

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-[#172b4d]">
    
      <ManagerSidebar
        activeMenu={activeMenu}
        onMenuClick={handleMenuClick}
        managerName={managerName}
        institutionName={institutionName}
        onLogout={handleLogout}
       />

   

      <main className="lg:ml-[288px]">
     
        <ManagerTopbar
           managerName={managerName}
           search={search}
           setSearch={setSearch}
           activeMenu={activeMenu}
        />


        <div className="px-5 py-7 lg:px-11">
        

          <section className="mb-8 flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
            <div>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[1.5px] text-[#6379dc]">
                {currentDate}
              </p>

              <h2 className="text-[30px] font-bold tracking-[-1px] text-[#172f52] sm:text-[34px]">
                Good morning, {firstName}
              </h2>

              <p className="mt-1 text-[13px] text-[#8090a8]">
                Here's what's happening across your student analytics workspace.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setActiveMenu("Reports")}
                className="flex items-center gap-2 rounded-lg border border-[#dfe4ed] bg-white px-4 py-2.5 text-[12px] font-semibold text-[#344867] shadow-sm hover:bg-[#fafbfc]"
              >
                <Icon type="reports" size={17} />
                View reports
              </button>

              <button
                onClick={() => setActiveMenu("AI Analysis")}
                className="flex items-center gap-2 rounded-lg bg-[#5268d8] px-4 py-2.5 text-[12px] font-semibold text-white shadow-[0_5px_14px_rgba(82,104,216,0.25)] hover:bg-[#465bc5]"
              >
                <span className="text-lg leading-none">+</span>
                New analysis
              </button>
            </div>
          </section>

          {/* -----------------------------------------------
              Statistics
          ------------------------------------------------ */}

          <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {statistics.map((stat) => {
              const styles = getStatStyles(stat.color);

              return (
                <div
                  key={stat.title}
                  className="min-h-[172px] rounded-xl border border-[#e4e8ef] bg-white p-5 shadow-[0_2px_8px_rgba(32,45,72,0.03)]"
                >
                  <div className="flex items-start justify-between">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl ${styles.bg} ${styles.text}`}
                    >
                      <Icon type={stat.icon} size={21} />
                    </div>

                    {stat.trend && (
                      <span className="text-[11px] font-semibold text-[#19a68e]">
                        ↗ {stat.trend}
                      </span>
                    )}
                  </div>

                  <div className="mt-4">
                    <h3 className="text-[27px] font-bold tracking-[-0.5px] text-[#172f52]">
                      {stat.value}
                    </h3>

                    <p className="mt-1 text-[12px] font-semibold text-[#243c5e]">
                      {stat.title}
                    </p>

                    <p className="mt-1 text-[11px] text-[#8c9bb0]">
                      {stat.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </section>

          {/* -----------------------------------------------
              Analytics + Attention
          ------------------------------------------------ */}

          <section className="mb-6 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(350px,0.9fr)]">
            {/* Chart */}
            <div className="rounded-xl border border-[#e4e8ef] bg-white p-6 shadow-[0_2px_8px_rgba(32,45,72,0.03)]">
              <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <h3 className="text-[16px] font-semibold text-[#172f52]">
                    Academic performance trends
                  </h3>

                  <p className="mt-1 text-[11px] text-[#8b9ab0]">
                    Average student performance over time
                  </p>
                </div>

                <button className="flex items-center justify-between gap-4 rounded-lg border border-[#e1e6ef] px-3 py-2 text-[11px] text-[#566983]">
                  Last 6 months
                  <Icon type="down" size={14} />
                </button>
              </div>

              {/* Legend */}
              <div className="mb-2 flex justify-end gap-5">
                <div className="flex items-center gap-2 text-[11px] text-[#7788a1]">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#5268d8]" />
                  Average performance
                </div>

                <div className="flex items-center gap-2 text-[11px] text-[#7788a1]">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#14aa9d]" />
                  Average attendance
                </div>
              </div>

              {/* Chart */}
              <div className="relative h-[285px] w-full">
                {/* Grid */}
                <div className="absolute inset-0 flex flex-col justify-between pb-7 pl-12">
                  {[100, 75, 50, 25, 0].map((value) => (
                    <div key={value} className="flex items-center gap-3">
                      <span className="w-7 text-right text-[10px] text-[#9aa7ba]">
                        {value}%
                      </span>

                      <div className="h-px flex-1 border-t border-dashed border-[#e5e9f0]" />
                    </div>
                  ))}
                </div>

                {/* SVG chart */}
                <svg
                  className="absolute inset-0 h-full w-full"
                  viewBox="0 0 760 285"
                  preserveAspectRatio="none"
                >
                  {/* Performance */}
                  <polyline
                    fill="none"
                    stroke="#5268d8"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points="55,106 195,97 335,112 475,88 615,97 735,77"
                  />

                  {/* Attendance */}
                  <polyline
                    fill="none"
                    stroke="#14aa9d"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points="55,82 195,76 335,91 475,69 615,79 735,62"
                  />

                  {/* Performance points */}
                  {[
                    [55, 106],
                    [195, 97],
                    [335, 112],
                    [475, 88],
                    [615, 97],
                    [735, 77],
                  ].map(([cx, cy], index) => (
                    <circle
                      key={`p-${index}`}
                      cx={cx}
                      cy={cy}
                      r="4"
                      fill="white"
                      stroke="#5268d8"
                      strokeWidth="3"
                    />
                  ))}

                  {/* Attendance points */}
                  {[
                    [55, 82],
                    [195, 76],
                    [335, 91],
                    [475, 69],
                    [615, 79],
                    [735, 62],
                  ].map(([cx, cy], index) => (
                    <circle
                      key={`a-${index}`}
                      cx={cx}
                      cy={cy}
                      r="4"
                      fill="white"
                      stroke="#14aa9d"
                      strokeWidth="3"
                    />
                  ))}
                </svg>

                {/* X labels */}
                <div className="absolute bottom-0 left-12 right-0 flex justify-between">
                  {chartData.map((item) => (
                    <span
                      key={item.month}
                      className="text-[10px] text-[#9aa7ba]"
                    >
                      {item.month}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Attention panel */}
            <div className="rounded-xl border border-[#e4e8ef] bg-white p-6 shadow-[0_2px_8px_rgba(32,45,72,0.03)]">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="text-[16px] font-semibold text-[#172f52]">
                    Needs your attention
                  </h3>

                  <p className="mt-1 text-[11px] text-[#8b9ab0]">
                    Key observations from recent analyses
                  </p>
                </div>

                <span className="rounded-lg bg-[#fff0ef] px-2.5 py-1.5 text-[10px] font-semibold text-[#e8736d]">
                  3 new
                </span>
              </div>

              <div className="divide-y divide-[#edf0f4]">
                {attentionItems.map((item) => {
                  const iconStyles = {
                    red: "bg-red-50 text-red-400",
                    orange: "bg-orange-50 text-orange-400",
                    blue: "bg-indigo-50 text-indigo-500",
                  };

                  return (
                    <div key={item.title} className="py-4 first:pt-3 last:pb-1">
                      <div className="flex gap-3">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconStyles[item.color]}`}
                        >
                          <Icon type={item.icon} size={18} />
                        </div>

                        <div className="min-w-0">
                          <p className="text-[12px] font-semibold text-[#273d5e]">
                            {item.title}
                          </p>

                          <p className="mt-1 text-[10px] leading-5 text-[#8998ae]">
                            {item.description}
                          </p>

                          <button
                            onClick={() => setActiveMenu(item.title)}
                            className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-[#5268d8]"
                          >
                            {item.action}
                            <Icon type="arrow" size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* -----------------------------------------------
              Recent analyses + Upload
          ------------------------------------------------ */}

          <section className="mb-7 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.8fr)_minmax(330px,0.8fr)]">
            {/* Recent AI analyses */}
            <div className="overflow-hidden rounded-xl border border-[#e4e8ef] bg-white shadow-[0_2px_8px_rgba(32,45,72,0.03)]">
              <div className="flex items-center justify-between border-b border-[#edf0f4] px-6 py-5">
                <div>
                  <h3 className="text-[16px] font-semibold text-[#172f52]">
                    Recent AI analyses
                  </h3>

                  <p className="mt-1 text-[11px] text-[#8b9ab0]">
                    A snapshot of your latest dataset reviews
                  </p>
                </div>

                <button
                  onClick={() => setActiveMenu("Analysis History")}
                  className="flex items-center gap-1 text-[11px] font-semibold text-[#5268d8]"
                >
                  View all
                  <Icon type="arrow" size={14} />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="border-b border-[#edf0f4] bg-[#fbfcfe]">
                      <th className="px-6 py-4 text-left text-[9px] font-semibold uppercase tracking-[0.7px] text-[#8493a9]">
                        Dataset
                      </th>

                      <th className="px-4 py-4 text-left text-[9px] font-semibold uppercase tracking-[0.7px] text-[#8493a9]">
                        Date
                      </th>

                      <th className="px-4 py-4 text-left text-[9px] font-semibold uppercase tracking-[0.7px] text-[#8493a9]">
                        Students
                      </th>

                      <th className="px-4 py-4 text-left text-[9px] font-semibold uppercase tracking-[0.7px] text-[#8493a9]">
                        Review indicators
                      </th>

                      <th className="px-4 py-4 text-left text-[9px] font-semibold uppercase tracking-[0.7px] text-[#8493a9]">
                        Status
                      </th>

                      <th className="px-6 py-4 text-right text-[9px] font-semibold uppercase tracking-[0.7px] text-[#8493a9]">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {recentAnalyses.map((analysis) => (
                      <tr
                        key={analysis.id}
                        className="border-b border-[#edf0f4] last:border-b-0 hover:bg-[#fbfcff]"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#eef0ff] text-[#5268d8]">
                              <Icon type="file" size={17} />
                            </div>

                            <div>
                              <p className="text-[12px] font-semibold text-[#273d5e]">
                                {analysis.dataset}
                              </p>

                              <p className="mt-0.5 text-[9px] text-[#9aa7ba]">
                                {analysis.id}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 text-[11px] text-[#6f8099]">
                          {analysis.date}
                        </td>

                        <td className="px-4 py-4 text-[11px] text-[#6f8099]">
                          {analysis.students}
                        </td>

                        <td className="px-4 py-4 text-[11px] text-[#6f8099]">
                          {analysis.indicators}
                        </td>

                        <td className="px-4 py-4">
                          <span className="inline-flex items-center gap-1.5 rounded-md bg-[#eaf8f2] px-2.5 py-1 text-[9px] font-semibold text-[#1b9c72]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#1b9c72]" />

                            {analysis.status}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setActiveMenu("Reports")}
                            className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#5268d8]"
                          >
                            View report
                            <Icon type="arrow" size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Upload CTA */}
            <div className="rounded-xl border border-[#dfe4f5] bg-[#f4f5ff] p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e7eaff] text-[#5268d8]">
                <Icon type="ai" size={20} />
              </div>

              <h3 className="mt-5 text-[16px] font-semibold text-[#253a5c]">
                Have new student data?
              </h3>

              <p className="mt-2 text-[11px] leading-5 text-[#7e8da5]">
                Upload a dataset to explore academic patterns, attendance
                signals, and students who may need review.
              </p>

              {/* Steps */}
              <div className="mt-5 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#e4e7fb] text-[9px] font-semibold text-[#5268d8]">
                    1
                  </span>

                  <span className="text-[11px] text-[#637692]">
                    Upload your dataset
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#e4e7fb] text-[9px] font-semibold text-[#5268d8]">
                    2
                  </span>

                  <span className="text-[11px] text-[#637692]">
                    Review the data preview
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#e4e7fb] text-[9px] font-semibold text-[#5268d8]">
                    3
                  </span>

                  <span className="text-[11px] text-[#637692]">
                    Explore the analysis
                  </span>
                </div>
              </div>

              <button
                onClick={() => setActiveMenu("Upload Data")}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#5268d8] px-4 py-3 text-[11px] font-semibold text-white shadow-[0_5px_14px_rgba(82,104,216,0.22)] hover:bg-[#465bc5]"
              >
                Upload student data
                <Icon type="arrow" size={15} />
              </button>
            </div>
          </section>
          
          <ManagerFooter institutionName={institutionName} />

        </div>
      </main>
    </div>
  );
};

export default ManagerDashboard;
