const formatDate = (date: Date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0"); // getMonth()는 0부터 시작하므로 +1 필요
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export { formatDate };
