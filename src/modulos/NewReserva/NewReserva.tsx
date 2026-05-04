"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  createDayView,
  createMonthView,
  createWeekView,
  createYearView,
  DayFlowCalendar,
  useCalendarApp,
  ViewType,
  type CalendarSearchEvent,
  type Event as DayFlowEvent,
  type EventContentSlotArgs,
} from "@dayflow/react";
import { useRouter } from "next/navigation";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import ReservationDetailModal from "@/modulos/Reservas/RenderView/RenderView";
import { IconNewReserve } from "@/components/layout/icons/IconsBiblioteca";
import styles from "./NewReserva.module.css";
import { useNewReserva } from "./useNewReserva";
import {
  RESERVATION_CALENDARS,
  getReservationFromCalendarEvent,
  getReservationMetaFromCalendarEvent,
  getVisibleRangeForView,
  normalizeSearchText,
} from "./helpers";

const NewReserva = () => {
  const router = useRouter();
  const controller = useNewReserva();
  const calendarLocale = useMemo(
    () => ({
      code: "es",
      messages: {
        allDay: "Todo el día",
        today: "Hoy",
        tomorrow: "Mañana",
        day: "Día",
        week: "Semana",
        month: "Mes",
        year: "Año",
        search: "Buscar",
        noResults: "Sin resultados",
        calendar: "Calendario",
        starts: "Inicio",
        ends: "Fin",
        notes: "Notas",
        viewEvent: "Ver evento",
        done: "Cerrar",
      },
    }),
    [],
  );

  const renderEventContent = useCallback(({ event }: EventContentSlotArgs) => {
    const meta = getReservationMetaFromCalendarEvent(event);
    const eventMeta = [meta?.unitLabel, meta?.residentName]
      .filter(Boolean)
      .join(" · ");

    return (
      <div className={styles.eventBody}>
        <span className={styles.eventTitle}>{meta?.areaName || event.title}</span>
        {eventMeta ? <span className={styles.eventMeta}>{eventMeta}</span> : null}
      </div>
    );
  }, []);

  const searchConfig = useMemo(
    () => ({
      emptyText: "Sin resultados",
      customSearch: ({
        keyword,
        events,
      }: {
        keyword: string;
        events: CalendarSearchEvent[];
      }) => {
        const normalizedKeyword = normalizeSearchText(keyword);
        if (!normalizedKeyword) return events;

        return events.filter((event) => {
          const meta = getReservationMetaFromCalendarEvent(event);
          const haystack = [
            event.title,
            event.description,
            meta?.searchText,
          ]
            .filter(Boolean)
            .join(" ");

          return normalizeSearchText(haystack).includes(normalizedKeyword);
        });
      },
      onResultClick: ({
        event,
        defaultAction,
      }: {
        event: CalendarSearchEvent;
        defaultAction: () => void;
      }) => {
        const reservation = getReservationFromCalendarEvent(event);
        if (reservation) {
          defaultAction();
          controller.openReservationDetail(reservation);
          return;
        }
        defaultAction();
      },
    }),
    [controller.openReservationDetail],
  );

  const initialDateRef = useRef(new Date());
  const lastCalendarStateRef = useRef<{
    view: ViewType;
    date: Date;
  }>({
    view: ViewType.MONTH,
    date: initialDateRef.current,
  });

  const dayflowConfig = useMemo(
    () => ({
      views: [
        createDayView({
          showAllDay: true,
        }),
        createWeekView({
          startOfWeek: 1,
          showAllDay: true,
        }),
        createMonthView({
          startOfWeek: 1,
          scroll: { disabled: true, transition: "fade" },
        }),
        createYearView(),
      ],
      events: controller.calendarEvents,
      calendars: RESERVATION_CALENDARS,
      defaultView: lastCalendarStateRef.current.view,
      initialDate: lastCalendarStateRef.current.date,
      switcherMode: "buttons" as const,
      useCalendarHeader: true,
      useEventDetailDialog: false,
      useEventDetailPanel: false,
      locale: calendarLocale,
      readOnly: true,
      theme: { mode: "dark" as const },
      callbacks: {
        onEventClick: (event: DayFlowEvent) => {
          const reservation = getReservationFromCalendarEvent(event);
          if (reservation) {
            controller.openReservationDetail(reservation);
          }
        },
      },
    }),
    [calendarLocale, controller.calendarEvents, controller.openReservationDetail],
  );

  const calendarVersion = useMemo(
    () =>
      controller.calendarEvents
        .map((event) => `${event.id}:${String(event.start)}:${String(event.end)}`)
        .join("|"),
    [controller.calendarEvents],
  );

  const calendar = useCalendarApp(dayflowConfig, calendarVersion);

  useEffect(() => {
    lastCalendarStateRef.current = {
      view: calendar.currentView as ViewType,
      date: new Date(calendar.currentDate),
    };
  }, [calendar.currentDate, calendar.currentView]);

  useEffect(() => {
    const range = getVisibleRangeForView(
      calendar.currentDate,
      calendar.currentView,
    );

    controller.handleVisibleRangeChange(range.start, range.end);
  }, [calendar.currentDate, calendar.currentView, controller.handleVisibleRangeChange]);

  useEffect(() => {
    calendar.highlightEvent(controller.selectedReservationId);
  }, [calendar, controller.selectedReservationId]);

  if (!controller.canView) return <NotAccess />;

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div className={styles.heading}>
          <p className={styles.eyebrow}>Reservas</p>
          <h1 className={styles.title}>Calendario</h1>
          <p className={styles.subtitle}>
            Esta vista usa DayFlow como superficie principal y deja intacto el
            flujo multistep existente para crear reservas.
          </p>
        </div>

        {controller.canCreate ? (
          <button
            type="button"
            className={styles.primaryAction}
            onClick={() => router.push("/create-reservas")}
          >
            <IconNewReserve size={18} />
            Nueva reserva
          </button>
        ) : null}
      </header>

      <div className={styles.calendarShell}>
        {controller.loading ? (
          <div className={styles.loadingBadge}>Actualizando reservas...</div>
        ) : null}

        <DayFlowCalendar
          calendar={calendar}
          search={searchConfig}
          eventContentDay={renderEventContent}
          eventContentWeek={renderEventContent}
          eventContentYear={renderEventContent}
          eventContentAllDayDay={renderEventContent}
          eventContentAllDayWeek={renderEventContent}
          eventContentAllDayYear={renderEventContent}
        />
      </div>

      {controller.detailItem ? (
        <ReservationDetailModal
          open
          item={controller.detailItem}
          onClose={() => controller.setDetailItem(null)}
          reLoad={controller.reloadCurrentRange}
        />
      ) : null}
    </section>
  );
};

export default NewReserva;
