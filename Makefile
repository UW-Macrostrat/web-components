all:
	git submodule update --init --recursive

push:
	find . -depth -name .git -exec dirname {} \\; 2> /dev/null \
	| sort -n -r \
	| xargs -I{} bash -c \"cd {}; git status \
	| grep ahead > /dev/null && { echo '* Pushing: {}'; git push; }\""