"use client";
import { useState } from "react";
import TabsButtons from "@/mk/components/ui/TabsButton/TabsButtons";
import EventsAdmin from "./EventsAdmin/EventsAdmin";

const Events = () => {
  const [typeSearch, setTypeSearch] = useState("A");
  return (
    <div>
      {/* <div>
        <TabsButtons
          tabs={[
            { value: "A", text: "Administrador" },
            // { value: "M", text: "Métricas" },
          ]}
          sel={typeSearch}
          setSel={setTypeSearch}
        />
      </div> */}

      {typeSearch === "A" && <EventsAdmin />}
      {/* {typeSearch === "M" && <EventsDashboard />} */}
    </div>
  );
};

export default Events;
