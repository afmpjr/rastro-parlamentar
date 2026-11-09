import { queryOptions } from "@tanstack/react-query";
import { listarParlamentares } from "./fontes.functions";
export const parlamentaresQuery = queryOptions({ queryKey: ["parlamentares"], queryFn: () => listarParlamentares(), staleTime: 3600_000 });
