"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, CalendarDays, FileChartColumn, LogIn, Receipt, Wallet } from "lucide-react";
import { useAuth } from "@/mk/contexts/AuthProvider";
import NotAccess from "@/components/layout/NotAccess/NotAccess";
import TabsButtons from "@/mk/components/ui/TabsButton/TabsButtons";
import { encodeReportViewerState } from "./reportViewerState";
import { getCurrentMonthRange, reportCatalog, reportCategories } from "./reportCatalog";
import styles from "./ReportsCatalog.module.css";

const reportIcons = { accesses: LogIn, income: Wallet, receivables: Receipt };

export default function ReportsCatalog() {
  const { userCan, setStore } = useAuth();
  const [category, setCategory] = useState("all");
  const available = reportCatalog.filter((report) => report.permissions.some((permission) => userCan(permission, "R")));
  const tabs = reportCategories.filter((tab) => tab.value === "all" || available.some((report) => report.category === tab.value));
  const activeCategory = tabs.some((tab) => tab.value === category) ? category : "all";
  const visible = available.filter((report) => activeCategory === "all" || report.category === activeCategory);

  useEffect(() => {
    setStore({ title: "Reportes", right: null });
    // The legacy context recreates setStore on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (available.length === 0) return <NotAccess />;

  return (
    <section className={styles.catalog} aria-labelledby="reports-heading">
      <header className={styles.heading}>
        <h1 id="reports-heading">Reportes</h1>
        <p>Consulta la información de tu condominio y descarga los reportes que necesitas.</p>
      </header>
      <div className={styles.tabs} aria-label="Categorías de reportes">
        <TabsButtons tabs={tabs} sel={activeCategory} setSel={setCategory} variant="rounded" />
      </div>
      <div className={styles.grid}>
        {visible.map((report) => {
          const Icon = reportIcons[report.icon];
          const range = getCurrentMonthRange();
          const dateField = report.key === "accesses" ? "in_at" : "paid_at";
          const dateFilter = report.key === "accounts-receivable" ? "due_at:all" : `${dateField}:${range.startDate},${range.endDate}`;
          const state = encodeReportViewerState({ params: { filterBy: dateFilter } });

          return (
            <Link key={report.key} className={styles.card} target="_blank" rel="noopener noreferrer" href={`/reports/view?preset=${report.key}&state=${state}`}>
              <div className={styles.cardTop}>
                <span className={`${styles.icon} ${report.category === "finance" ? styles.financeIcon : styles.securityIcon}`}><Icon size={22} strokeWidth={1.6} aria-hidden="true" /></span>
                <ArrowUpRight className={styles.arrow} size={21} aria-hidden="true" />
              </div>
              <div className={styles.cardBody}>
                <h2>{report.title}</h2>
                <p>{report.description}</p>
              </div>
              <div className={styles.cardFooter}>
                <span><CalendarDays size={15} aria-hidden="true" />{report.period}</span>
                <span><FileChartColumn size={15} aria-hidden="true" />PDF · Excel</span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
