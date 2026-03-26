import Tag from "./Tag";
import styles from "./FilterTags.module.css";

interface PropsType {
  title: string;
  data: any;
  msgEmpty?: string;
  setFilters?: any;
  type?: string;
  filters?: any;
}

const FilterTags = ({
  title,
  data,
  msgEmpty = "Sin datos",
  setFilters,
  type = "",
  filters,
}: PropsType) => {
  const _onClick = (item: any) => {
    if (type === "dpto_id") {
      if (filters?.dpto_id == item.id) {
        setFilters((prev: any) => ({ ...prev, dpto_id: null }));
        setFilters((prev: any) => ({ ...prev, local_id: null }));
        return;
      }
      setFilters((prev: any) => ({ ...prev, [type]: item.id }));
    } else if (type === "mun_id") {
      if (filters?.mun_id == item.id) {
        setFilters((prev: any) => ({ ...prev, mun_id: null }));
        return;
      }
      setFilters((prev: any) => ({ ...prev, [type]: item.id }));
    } else if (type === "gender") {
      setFilters((prev: any) => ({ ...prev, [type]: item.id }));
      if (filters.gender == item.id) {
        setFilters((prev: any) => ({ ...prev, gender: null }));
      }
    } else if (type === "ages") {
      setFilters((prev: any) => ({ ...prev, [type]: item.id }));
      if (filters.ages == item.id) {
        setFilters((prev: any) => ({ ...prev, ages: null }));
      }
    } else if (type === "education") {
      setFilters((prev: any) => ({ ...prev, [type]: item.id }));
      if (filters.education == item.id) {
        setFilters((prev: any) => ({ ...prev, education: null }));
      }
    } else if (type === "is_verify") {
      setFilters((prev: any) => ({ ...prev, [type]: item.id }));
      if (filters.is_verify == item.id) {
        setFilters((prev: any) => ({ ...prev, is_verify: "" }));
      }
    }
  };

  return (
    <div className={styles.container}>
      <p>{title}</p>
      {data?.length === 0 ? (
        <span>{msgEmpty}</span>
      ) : (
        <div>
          {data?.map((item: any, index: any) => (
            <Tag
              style={{
                backgroundColor: filters?.[type] == item.id ? "#39ACEC33" : "",
                color: filters?.[type] == item.id ? "var(--cInfo)" : "",
              }}
              key={index}
              item={item}
              onClick={() => _onClick(item)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FilterTags;
