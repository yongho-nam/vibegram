import { Link } from "react-router-dom";
import { BRAND_NAME } from "@/config/brand";
import styles from "./NotFoundPage.module.css";

export function NotFoundPage() {
  return (
    <div className={styles.root}>
      <h1 className={styles.code}>404</h1>
      <p className={styles.msg}>죄송합니다. 해당 페이지를 사용할 수 없습니다.</p>
      <Link to="/" className={styles.link}>
        {BRAND_NAME} 홈으로 돌아가기
      </Link>    </div>
  );
}
