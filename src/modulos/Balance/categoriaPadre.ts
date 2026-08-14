/**
 * Con qué categoría PADRE se agrupa una fila del histórico de balance.
 *
 * 🔴 CDT-31: "no tiene padre" NO llega como `null`. La API estampa el campo
 * como cadena (`UtilsGraph::formatExpenseResultsWithAllMonths` hace
 * `'' . $category['category_id']`), así que una categoría padre con movimiento
 * DIRECTO viaja con `category_id: ""`. Las tablas comparaban contra `null` a
 * secas: esas filas caían en la rama de "soy hija", se buscaba un padre con id
 * `""`, no existía y el monto se descartaba en silencio — la categoría salía
 * en la tabla con 0.00 aunque el movimiento estuviera en la base.
 *
 * Vive acá y no duplicado en cada tabla porque `TableIngresos` y `TableEgresos`
 * hacen exactamente lo mismo con la misma respuesta.
 */
export const idCategoriaPadre = (item: {
  categ_id: string | number;
  category_id?: string | number | null;
}): string | number =>
  item.category_id === null ||
  item.category_id === undefined ||
  item.category_id === ""
    ? item.categ_id
    : item.category_id;
