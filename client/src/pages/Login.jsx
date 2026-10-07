import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  
  const handleSendOTP = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/login/send-otp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send OTP");
      }
      setMessage("OTP sent successfully. Check your email.");
      setStep("otp");
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };


  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/login/verify-otp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            otp,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Invalid OTP");
      }

     localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

   
      if (data.user.role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/manager/dashboard");
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep("email");
    setOtp("");
    setError("");
    setMessage("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">

    
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            AI Student Analytics
          </h1>

          <p className="text-gray-500 mt-2">
            {step === "email"
              ? "Login to your account"
              : "Verify your OTP"}
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-lg bg-red-100 text-red-700 text-sm">
            {error}
          </div>
        )}

  
        {message && (
          <div className="mb-5 p-3 rounded-lg bg-green-100 text-green-700 text-sm">
            {message}
          </div>
        )}

        {step === "email" && (
          <form onSubmit={handleSendOTP} className="space-y-5">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg
              font-semibold hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>

          </form>
        )}

        {step === "otp" && (
          <form onSubmit={handleVerifyOTP} className="space-y-5">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter OTP
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg
                text-center text-xl tracking-widest
                focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg
              font-semibold hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify & Login"}
            </button>

            <button
              type="button"
              onClick={handleBack}
              className="w-full text-gray-600 hover:text-blue-600"
            >
              ← Change Email
            </button>

          </form>
        )}

        <div className="text-center mt-6 pt-6 border-t">
          <p className="text-gray-600">
            Don't have an account?{" "}
            <button
              onClick={() => navigate("/register")}
              className="text-blue-600 font-semibold hover:underline"
            >
              Register
            </button>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Login;