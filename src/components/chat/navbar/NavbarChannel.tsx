import React, { useState } from "react";

interface NavbarChannelProps {}

export const NavbarChannel: React.FC<NavbarChannelProps> = ({}) => {
  const [isActive, setActive] = useState(true);

  const handleToggle = () => {
    isActive == !isActive;
  };
  return (
    <div
      className={!isActive ? "sidebarChannel" : "sidebarChannel-active"}
      id="ass"
      onClick={handleToggle}
    >
      <h4>
        <span className="sidebarChannel__hash">#</span>
        <div className="sidebarChannel__channelName">dupa123</div>
      </h4>
    </div>
  );
};
