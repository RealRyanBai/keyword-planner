import { notFound } from "next/navigation";

export default function Home() {
  // 直接不要主页，访问主页返回真实 404
  notFound();
}
