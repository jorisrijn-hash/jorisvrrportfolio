# Reference material — NEVER SHIPPED

These are the source design files. They live OUTSIDE `public/` on purpose:
nothing in this directory is served to a browser, and no component may render
them.

    loadingempty.png        the static composition, 1920x950
    loadinganimation.mp4    boot sequence, 17.150s @ 59.94fps
    loadinganimation.mp3    its soundtrack, 17.152s
    mainbackground.mp4      home idle loop, 3.136s
    maintofeaturedwork.mp4  home -> work, 12.512s
    maintoabout.mp4         home -> about, 11.712s

They exist ONLY to be inspected — composition, timing, geometry, movement,
hierarchy. Everything visible on the site is rebuilt natively in HTML/CSS/SVG.

If you ever find a `<video>` pointing at one of these, it is a bug.
