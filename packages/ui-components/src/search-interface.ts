import { useState, useEffect } from "react";
/*
import { useRouter } from 'next/router'

const useSearchString = (pathname)=> {
  // A React hook to manage a search string and
  // synchronize URL query parameters
  const router = useRouter();

  const [searchString, setState] = useState()

  useEffect(()=>{
    if (searchString == null) {
      setState(router.query.search)
    }
  }, [router.query]);

  const updateSearchString = (val)=>{
    setState(val)
    // Update query to house search string
    const href = {
      pathname,
      query: {search: val}
    };
    const as = href;
    router.push(href, as, {shallow: true});
  }

  return [searchString, updateSearchString]
}
*/

/*
const ResultView = (props)=>{
  const {searchString, debounce} = props;

  if (searchString != null && searchString != '') {
      return h(InfiniteScrollResultView, {
          route: "https://geodeepdive.org/api/snippets"
          params={{"term":searchString, "full_results": true, inclusive: true, article_limit: 2}}
          unwrapResponse={res=>res.success}>
          {SnippetResults}
  }
  return <Callout icon="alert" title="Snippets"
    intent="info">
    Search xDD for contextual use of a term or phrase.
  </Callout>

}

const SnippetsPage = (props)=>{
  const [searchString, updateSearchString] = useSearchString("/snippets");
  const [inputValue, setInputValue] = useState("");
  // Set input value to search string when it changes (enables default search behaviour)
  useEffect(()=>{
    setInputValue(searchString)
  }, [searchString])


  return <BasePage title="snippets search">
    <div className="searchbar">
      <InputGroup
        className="main-search"
        placeholder="Enter a search term"
        leftIcon="search"
        large
        value={inputValue}
        onChange={event => setInputValue(event.target.value)}
        onKeyPress={event => {
          if (event.key === 'Enter') {
            updateSearchString(event.target.value);
          }
        }}
      />
      <Button icon='arrow-right' large onClick={()=>{
        updateSearchString(inputValue)
      }
      }/>
    </div>
    <ResultView searchString={searchString} />
  </BasePage>
}
*/
