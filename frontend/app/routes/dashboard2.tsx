import type React from "react";
import Sidebar from "~/components/layout/Sidebar";

const Dashboard2: React.FC = () => {
  return (
    <>
      <div className="flex">
        <Sidebar />
        <div>
          <h1>Dashboard 2</h1>
        </div>
      </div>
    </>
  );
};

export default Dashboard2;
