// @ts-nocheck
import { Component } from "react";
import h from "@macrostrat/hyper";
import { Button, ButtonGroup, NonIdealState } from "@blueprintjs/core";
import { APIResultView } from "./frontend";

const Pagination = (props) => {
  const { currentPage, nextDisabled, setPage } = props;

  return h(ButtonGroup, [
    h(
      Button,
      {
        onClick: () => setPage(currentPage - 1),
        icon: "arrow-left",
        disabled: currentPage <= 0,
      },
      "Previous",
    ),
    h(
      Button,
      {
        onClick: () => setPage(currentPage + 1),
        rightIcon: "arrow-right",
        disabled: nextDisabled,
      },
      "Next",
    ),
  ]);
};

class PagedAPIView extends Component<any, any> {
  static defaultProps = {
    count: null,
    perPage: 20,
    topPagination: false,
    bottomPagination: true,
    extraPagination: null,
    opts: {}, // Options passed to GET
    params: {},
    getTotalCount(response) {
      const { headers } = response;
      return parseInt(headers["x-total-count"]);
    },
  };
  constructor(props) {
    super(props);
    this.setPage = this.setPage.bind(this);
    this.params = this.params.bind(this);
    this.state = { currentPage: 0, count: null };
  }

  setPage(i) {
    return () => {
      return this.setState({ currentPage: i });
    };
  }

  renderPagination() {
    const { perPage } = this.props;
    const { count } = this.state;
    let nextDisabled = false;
    let paginationInfo = null;
    let currentPage = this.currentPage();
    const lastPage = this.lastPage();

    if (lastPage != null) {
      if (currentPage >= lastPage) {
        currentPage = lastPage;
        nextDisabled = true;
      }
      paginationInfo = h("div", { disabled: true }, [
        `${currentPage + 1} of ${lastPage + 1} (${count} records)`,
      ]);
    }

    return h("div.pagination-controls", [
      h(Pagination, { currentPage, nextDisabled, setPage: this.setPage }),
      this.props.extraPagination,
      paginationInfo,
    ]);
  }

  lastPage() {
    const { count } = this.state;
    const { perPage } = this.props;
    if (count == null) {
      return null;
    }
    let pages = Math.floor(count / perPage);
    if (count % perPage === 0) {
      pages -= 1;
    }
    return pages;
  }

  currentPage() {
    let { currentPage } = this.state;
    const lastPage = this.lastPage();
    if (lastPage != null && currentPage >= lastPage) {
      return lastPage;
    }
    if (currentPage < 0) {
      currentPage = 0;
    }
    return currentPage;
  }

  params() {
    const { params, perPage } = this.props;
    let { offset, limit, ...otherParams } = params;
    const currentPage = this.currentPage();
    if (offset == null) {
      offset = 0;
    }
    offset += currentPage * perPage;

    // This shouldn't happen but it does
    if (offset < 0) {
      offset = 0;
    }

    if (limit == null || limit > perPage) {
      limit = perPage;
    }

    return { offset, limit, ...otherParams };
  }

  render() {
    let {
      route,
      perPage,
      children,
      getTotalCount,
      primaryKey,
      count,
      topPagination,
      bottomPagination,
      extraPagination,
      params,
      opts,
      ...rest
    } = this.props;

    params = this.params();

    // Create new onResponse function
    const { onResponse: __onResponse } = opts;
    const onResponse = (response) => {
      count = getTotalCount(response);
      this.setState({ count });
      // Run inherited onResponse if it exists
      if (__onResponse != null) {
        return __onResponse(response);
      }
    };

    // Options for get
    opts = { ...opts, onResponse };

    const _children = (data) => {
      if (this.state.count === 0) {
        return h(NonIdealState, { icon: "search", title: "No results" });
      }
      // @ts-ignore
      return children(data);
    };

    return h("div.pagination-container", rest, [
      topPagination ? this.renderPagination() : undefined,
      h(APIResultView, { route, params, opts, primaryKey }, _children),
      bottomPagination ? this.renderPagination() : undefined,
    ]);
  }
}

export { PagedAPIView, Pagination };
