import h from "@macrostrat/hyper";
import { useEffect, useRef } from "react";
import { Spinner } from "@blueprintjs/core";
import { useState } from "react";

interface LoadMoreTriggerProps {
  data: any[];
  setLastID: (id: number) => void;
  pageSize: number;
  idKey: string;
}

interface InfiniteScrollContainerProps {
  startData: any[];
  useData: (lastID: number, input: string, pageSize: number) => any[];
  List: React.ComponentType<{ data: any[] }>;
  idKey: string;
  SearchBar?: React.ComponentType<{ input: string; setInput: (value: string) => void }>;
}

export function LoadMoreTrigger(props: LoadMoreTriggerProps) {
  const { data, setLastID, pageSize, idKey } = props;
  const ref = useRef(null);
  const loadMore = data.length % pageSize === 0;

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        if (data.length > 0) {
            const id = data[data.length - 1]?.[idKey];
            setLastID(id);
        }
      }
    });

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [data, setLastID]);

  return h.if(loadMore)("div.load-more", { ref }, h(Spinner));
}

export function InfiniteScrollContainer(props: InfiniteScrollContainerProps) {
  const { startData, useData, List, idKey, SearchBar } = props;
  const startingID = startData[startData.length - 1]?.[idKey] || startData.length; // Use the first item's id or default to 0
  const [lastID, setLastID] = useState(startingID);
  const [data, setData] = useState(startData);
  const pageSize = 5;

  // for filterable page
  const [input, setInput] = useState("");
  const prevInputRef = useRef(input);

  const result = useData(lastID, input, pageSize);

  useEffect(() => {
    // reset data if input changes
    if (prevInputRef.current !== input) {
      setData([]);
      setLastID(0);

      prevInputRef.current = input;
    }
  }, [input]);

  useEffect(() => {
    // add to result
    if (
      result &&
      data[data.length - 1]?.[idKey] !==
        result[result.length - 1]?.[idKey]
    ) {
      setData((prevData) => {
        return [...prevData, ...result];
      });
    }
  }, [result]);

  return h('div.scrollable-container', [
    h.if(SearchBar)(SearchBar, {
      input,
      setInput,
    }),
    h(List, { data }),
    LoadMoreTrigger({ data, setLastID, pageSize, idKey }),
  ]);
}