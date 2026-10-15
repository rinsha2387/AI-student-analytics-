import React from "react";

const Footer = ({ institutionName }) => {
  return (
    <footer className="flex flex-col justify-between gap-3 border-t border-[#e5e9ef] pt-5 text-[10px] text-[#98a5b8] sm:flex-row">
      <span>© 2026 AI Student Analytics</span>

      <span className="flex items-center gap-1.5">
        🛡 Insights support human judgment
        <span>·</span>
        {institutionName}
      </span>
    </footer>
  );
};

export default Footer;
