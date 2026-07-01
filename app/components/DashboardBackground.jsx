'use client';

/**
 * Abstract forest-green mesh background for dashboards.
 * Intentionally different from the landing page photo + 3D canvas.
 */
export default function DashboardBackground() {
  return (
    <div className="dashboard-bg" aria-hidden="true">
      <div className="dashboard-bg__mesh" />
      <div className="dashboard-bg__orb dashboard-bg__orb--1" />
      <div className="dashboard-bg__orb dashboard-bg__orb--2" />
      <div className="dashboard-bg__orb dashboard-bg__orb--3" />
      <div className="dashboard-bg__noise" />
    </div>
  );
}
