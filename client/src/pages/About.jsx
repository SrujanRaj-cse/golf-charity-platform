import React from "react";

export default function About() {
  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-5 pt-16 pb-10">
        <div className="text-3xl font-semibold">How it works</div>
        <div className="mt-2 text-sm text-slate-400">
          A subscription-based score rewards platform that supports real charity giving.
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="card">
            <div className="font-semibold">1) Enter your latest 5 scores</div>
            <div className="mt-2 text-sm text-slate-300">
              Enter scores in the range 1–45. The app timestamps them automatically and keeps only your latest 5.
            </div>
          </div>
          <div className="card">
            <div className="font-semibold">2) Admin runs monthly draws</div>
            <div className="mt-2 text-sm text-slate-300">
              Each month, admin generates 5 random numbers (1–45). Your scores are compared to determine match counts.
            </div>
          </div>
          <div className="card">
            <div className="font-semibold">3) Match 3, 4 or 5 numbers</div>
            <div className="mt-2 text-sm text-slate-300">
              Match 5 → jackpot (40%). Match 4 → 35%. Match 3 → 25%. If no 5-match winner, the jackpot rolls over.
            </div>
          </div>
        </div>

        <div className="mt-6 card">
          <div className="font-semibold">Charity support</div>
          <div className="mt-2 text-sm text-slate-300">
            Subscribers choose a charity and their subscription supports it with a percentage contribution. Users can adjust
            contribution between 10% and 100%.
          </div>
        </div>

        <div className="mt-6 card">
          <div className="font-semibold">Roles</div>
          <div className="mt-2 text-sm text-slate-300 space-y-2">
            <div>
              <span className="text-white font-medium">Public visitor</span> — explores platform and charities.
            </div>
            <div>
              <span className="text-white font-medium">Subscriber</span> — participates in draws and is eligible for rewards.
            </div>
            <div>
              <span className="text-white font-medium">Admin</span> — manages users, draws, winners, and charities.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

