"use client";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import styles from "../BankAccounts.module.css";
import { getUrlImages } from "@/mk/utils/string";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import { getFullName } from "../../../mk/utils/string";
import Button from "@/mk/components/forms/Button/Button";
import ActiveOwner from "@/components/ActiveOwner/ActiveOwner";
import { useEffect, useState } from "react";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { Card } from "@/mk/components/ui/Card/Card";

const RenderView = (props: any) => {
  const { open, onClose, item, reLoad, execute, showToast } = props;
  const { user } = useAuth();
  const client = item?.clients?.find(
    (item: any) => item?.id === user?.client_id
  );

  return (
    <>
      {open && (
        <DataModal
          open={open}
          onClose={onClose}
          title={"Detalle de la solicitud"}
          buttonText=""
          buttonCancel=""
          style={{ width: "max-content" }}
          className={styles.renderView}
        >
          <Card>
            <p>Alias</p>
          </Card>
        </DataModal>
      )}
    </>
  );
};

export default RenderView;
