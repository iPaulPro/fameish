export type RecordResponse<T> = {
  data: T | null;
  error: Error | null;
};
