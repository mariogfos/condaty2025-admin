export type FormEvent<T extends { [key: string]: string }> =
  React.FormEvent<HTMLFormElement> & {
    target: { elements: { [key in keyof T]: { value: T[key] } } };
  };

export type ParamsType = {
  perPage: number;
  page: number;
  fullType: string;
  sortBy?: string;
  orderBy?: string;
  relations?: string;
  joins?: string;
  searchBy?: string;
  filterBy?: string;
  cols?: string;
};
