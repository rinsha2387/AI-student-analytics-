import React, { useState } from "react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const handleSendOTP = (e) => {
    e.preventDefault();

    console.log("Login OTP:", {
      email,
    });

    // Later connect:
    // POST /api/auth/login/send-otp

    setOtpSent(true);
  };

  const handleVerifyOTP = (e) => {
    e.preventDefault();

    console.log("Verify Login OTP:", {
      email,
      otp,
    });

    // Later connect:
    // POST /api/auth/login/verify-otp

    // Backend will return the user's role.
    //
    // Example:
    // {
    //   token: "...",
    //   user: {
    //      name: "...",
    //      email: "...",
    //      role: "manager"
    //   }
    // }
    //
    // Then:
    // manager → Management Dashboard
    // admin   → Admin Dashboard
  };

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-white flex">

      {/* =====================================================
          LEFT SIDE
      ====================================================== */}

      <section className="hidden lg:flex lg:w-[43%] bg-[#eef1fb] relative overflow-hidden">

        {/* Decorative circles */}

        <div className="absolute -bottom-36 -right-32 w-[380px] h-[380px] rounded-full border-[75px] border-[#e1e6f7]" />

        <div className="absolute -bottom-16 right-16 w-[190px] h-[190px] rounded-full border-[45px] border-[#e6eafb]" />


        <div className="relative z-10 w-full px-10 py-7 flex flex-col">

          {/* =================================================
              LOGO
          ================================================== */}

          <div className="flex items-center gap-2.5">

            <div className="w-9 h-9 rounded-lg bg-[#5269d6] flex items-center justify-center shadow-md shadow-blue-200">

              <span className="text-white text-sm font-bold">
                AI
              </span>

            </div>


            <div>

              <h1 className="text-[17px] font-bold tracking-tight text-[#16244d]">

                AI Student
                <span className="text-[#5269d6]">
                  Analytics
                </span>

              </h1>


              <p className="text-[7px] tracking-[2px] uppercase text-[#7380a0]">
                Intelligent Student Insights
              </p>

            </div>

          </div>


          {/* =================================================
              LEFT CONTENT
          ================================================== */}

          <div className="mt-20 max-w-[420px]">

            {/* Badge */}

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-[#e1e5f2] shadow-sm">

              <span className="text-[#5269d6] text-xs">
                ✦
              </span>

              <span className="text-[10px] font-semibold text-[#5269d6]">
                Welcome back
              </span>

            </div>


            {/* Heading */}

            <h2 className="mt-5 text-[38px] leading-[1.08] tracking-[-1.5px] font-light text-[#17264f]">

              Understand
              <br />

              students.
              <br />

              <span className="font-medium">
                Make an impact.
              </span>

            </h2>


            {/* Description */}

            <p className="mt-4 text-[13px] leading-6 text-[#657ba5] max-w-[390px]">

              Access your student analytics workspace and
              use intelligent insights to make better academic
              decisions.

            </p>


            {/* =================================================
                FEATURES
            ================================================== */}

            <div className="mt-6 space-y-2.5">

              {/* Feature 1 */}

              <div className="flex items-center gap-2.5">

                <div className="w-7 h-7 rounded-md bg-white border border-[#e0e5f2] flex items-center justify-center text-[#5269d6] text-xs">
                  ✓
                </div>

                <span className="text-xs text-[#52658f]">
                  AI-powered student analysis
                </span>

              </div>


              {/* Feature 2 */}

              <div className="flex items-center gap-2.5">

                <div className="w-7 h-7 rounded-md bg-white border border-[#e0e5f2] flex items-center justify-center text-[#5269d6] text-xs">
                  ✓
                </div>

                <span className="text-xs text-[#52658f]">
                  Identify high-risk students
                </span>

              </div>


              {/* Feature 3 */}

              <div className="flex items-center gap-2.5">

                <div className="w-7 h-7 rounded-md bg-white border border-[#e0e5f2] flex items-center justify-center text-[#5269d6] text-xs">
                  ✓
                </div>

                <span className="text-xs text-[#52658f]">
                  Intelligent management insights
                </span>

              </div>

            </div>

          </div>


          {/* =================================================
              FOOTER
          ================================================== */}

          <div className="mt-auto text-[10px] text-[#8996b5]">
            © 2026 AI Student Analytics
          </div>

        </div>

      </section>


      {/* =====================================================
          RIGHT SIDE
      ====================================================== */}

      <section className="w-full lg:w-[57%] flex items-center justify-center px-6 py-5">

        <div className="w-full max-w-[430px]">


          {/* =================================================
              HEADER
          ================================================== */}

          <div className="mb-5">

            <p className="text-[10px] font-bold tracking-[2px] text-[#5269d6] uppercase">
              Welcome Back
            </p>


            <h2 className="mt-1.5 text-[26px] tracking-[-0.8px] font-light text-[#14244c]">
              Sign in to your workspace
            </h2>


            <p className="mt-1 text-xs text-[#9aa5b8]">
              Continue with your email and secure OTP.
            </p>

          </div>


          {!otpSent ? (

            /* =================================================
               EMAIL FORM
            ================================================== */

            <form
              onSubmit={handleSendOTP}
              className="space-y-3"
            >

              {/* Email */}

              <div>

                <label className="block text-[11px] font-semibold text-[#35425e] mb-1.5">
                  Email address
                </label>


                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full h-[43px] px-3 rounded-md
                  border border-[#dce1eb]
                  outline-none text-xs text-[#25355c]
                  placeholder:text-[#aab3c3]
                  focus:border-[#5269d6]
                  focus:ring-4 focus:ring-[#5269d6]/10
                  transition"
                />

              </div>


              {/* =================================================
                  OTP INFORMATION
              ================================================== */}

              <div className="flex items-center gap-2.5 p-2.5 rounded-md bg-[#f6f8fd]">

                <div className="w-7 h-7 shrink-0 rounded-md bg-white flex items-center justify-center text-[#5269d6] border border-[#e5e9f3] text-xs">
                  ✦
                </div>


                <p className="text-[10px] leading-4 text-[#7d899f]">

                  We'll send a secure 6-digit OTP to your
                  registered email address.

                </p>

              </div>


              {/* =================================================
                  SEND OTP BUTTON
              ================================================== */}

              <button
                type="submit"
                className="group w-full h-[45px] rounded-md
                bg-[#5269d6] hover:bg-[#465dc8]
                text-white text-xs font-semibold
                shadow-lg shadow-[#5269d6]/20
                transition-all
                flex items-center justify-center gap-2"
              >

                Continue with OTP

                <span className="text-base group-hover:translate-x-1 transition">
                  →
                </span>

              </button>

            </form>

          ) : (

            /* =================================================
               OTP VERIFICATION FORM
            ================================================== */

            <form
              onSubmit={handleVerifyOTP}
              className="space-y-4"
            >


              {/* =================================================
                  EMAIL INFORMATION
              ================================================== */}

              <div className="p-4 rounded-lg bg-[#f6f8fd] text-center">

                <div className="w-10 h-10 mx-auto rounded-lg bg-white border border-[#e1e5f2] flex items-center justify-center text-[#5269d6] text-lg">
                  ✉
                </div>


                <h3 className="mt-2.5 text-base font-semibold text-[#25355c]">
                  Check your email
                </h3>


                <p className="mt-1 text-xs text-[#8995aa]">
                  We sent a 6-digit OTP to
                </p>


                <p className="mt-1 text-xs font-semibold text-[#5269d6] break-all">
                  {email}
                </p>

              </div>


              {/* =================================================
                  OTP INPUT
              ================================================== */}

              <div>

                <label className="block text-[11px] font-semibold text-[#35425e] mb-1.5">
                  Verification code
                </label>


                <input
                  type="text"
                  inputMode="numeric"
                  maxLength="6"
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="Enter 6-digit OTP"
                  required
                  className="w-full h-[46px] px-4 rounded-md
                  border border-[#dce1eb]
                  outline-none text-center text-base
                  tracking-[7px] text-[#25355c]
                  placeholder:text-[#aab3c3]
                  placeholder:tracking-normal
                  focus:border-[#5269d6]
                  focus:ring-4 focus:ring-[#5269d6]/10
                  transition"
                />

              </div>


              {/* =================================================
                  LOGIN BUTTON
              ================================================== */}

              <button
                type="submit"
                className="group w-full h-[45px] rounded-md
                bg-[#5269d6] hover:bg-[#465dc8]
                text-white text-xs font-semibold
                shadow-lg shadow-[#5269d6]/20
                transition-all
                flex items-center justify-center gap-2"
              >

                Verify & Sign In

                <span className="text-base group-hover:translate-x-1 transition">
                  →
                </span>

              </button>


              {/* =================================================
                  CHANGE EMAIL
              ================================================== */}

              <button
                type="button"
                onClick={() => {
                  setOtpSent(false);
                  setOtp("");
                }}
                className="w-full text-[11px] font-medium text-[#5269d6] hover:underline"
              >

                ← Change email address

              </button>

            </form>

          )}


          {/* =================================================
              REGISTER LINK
          ================================================== */}

          <p className="text-center mt-4 text-[11px] text-[#9aa5b8]">

            Don't have an account?{" "}

            <a
              href="/register"
              className="font-semibold text-[#5269d6] hover:underline"
            >
              Create account
            </a>

          </p>


          {/* =================================================
              SECURITY
          ================================================== */}

          <div className="mt-3 flex items-center justify-center gap-1.5 text-[9px] text-[#a2acbc]">

            <span>🔒</span>

            Secure OTP authentication

          </div>

        </div>

      </section>

    </div>
  );
};

export default Login;