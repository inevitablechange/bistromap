"use client";
import NavBar from "./Navbar"; // NavBar 컴포넌트를 불러옵니다

const Header: React.FC = () => {
  return (
    <header
      style={{ width: "100%", height: 60, borderBottom: "1px solid #486284" }}
    >
      <NavBar />
    </header>
  );
};

export default Header;
