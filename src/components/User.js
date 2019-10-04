import React, { useState, useEffect, useRef } from "react"
import { useStateValue } from "../state"
import { withRouter } from "react-router-dom"
import { formatNum, abbrNum } from "../utils"
import Loader from "./Loader"
import BottomScrollListener from "react-bottom-scroll-listener"

const User = props => {
  const [{ animations, user, posts, isLoading }, dispatch] = useStateValue()
  const [end, setEnd] = useState("")
  const [mediaLoading, setMediaLoading] = useState(true)

  const goHome = () => {
    dispatch({
      type: "animation",
      payload: {
        ...animations,
        user: "animate__out--right",
        search: "animate__in--right"
      }
    })

    setTimeout(() => {
      dispatch({
        type: "user",
        payload: {}
      })

      dispatch({
        type: "posts",
        payload: {
          count: 0,
          posts: [],
          page_info: {}
        }
      })
      props.history.push("/")
    }, 500)
  }

  const handlePagination = () =>
    posts.posts.length < posts.count && getUserMedia(user.user.id)

  const getUserMedia = async id => {
    const url = `https://instagram.com/graphql/query/?query_id=17888483320059182&id=${id}&first=12&after=${end}`

    try {
      const data = await fetch(url)
      const json = await data.json()

      const currentPosts = posts.posts
      const fetchedPosts = json.data.user.edge_owner_to_timeline_media.edges

      if (currentPosts.length < posts.count)
        fetchedPosts.forEach(p => currentPosts.push(p))

      dispatch({
        type: "posts",
        payload: {
          count: json.data.user.edge_owner_to_timeline_media.count,
          posts:
            currentPosts.length <= 0
              ? json.data.user.edge_owner_to_timeline_media.edges
              : currentPosts,
          page_info: json.data.user.edge_owner_to_timeline_media.page_info
        }
      })

      setEnd(json.data.user.edge_owner_to_timeline_media.page_info.end_cursor)
      setMediaLoading(false)
    } catch (e) {
      console.error(e)
    }
  }

  const fetchInstagramUser = async username => {
    // const url = `http://167.99.121.93:5000/instagram?username=${username}`
    const url = `http://localhost:5000/instagram?username=${username}`
    try {
      const data = await fetch(url)
      const json = await data.json()
      dispatch({ type: "user", payload: json })
      dispatch({ type: "loading", payload: false })
      dispatch({
        type: "animation",
        payload: {
          ...animations,
          user: "animate__fade-in"
        }
      })

      getUserMedia(json.user.id)
    } catch (e) {
      // setError(true)
      props.history.push("/")
      console.error(`User ${username} not found.`)
    }
  }

  useEffect(() => {
    console.log("posts", posts)
    if (Object.entries(user).length === 0 && user.constructor === Object) {
      dispatch({ type: "loading", payload: true })
      const path = props.history.location.pathname
      const username = path.slice(1, path.length)
      fetchInstagramUser(username)
      setMediaLoading(true)
    } else {
      dispatch({ type: "loading", payload: false })
      getUserMedia(user.user.id)
      setMediaLoading(true)
      // dispatch({ type: "loading", payload: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const formatNumber = num => {
    if (num >= 10000) {
      return abbrNum(num, 0)
    } else if (num >= 1000 && num < 10000) {
      return formatNum(num)
    } else {
      return num
    }
  }

  if (!isLoading && Object.entries(user).length > 0) {
    const data = user.user
    const feed = posts.posts

    const mediaLoader = <Loader main="#70e8c8" sub="#ffffff" />

    const mappedFeed = feed.map(post => {
      const p = post.node
      return (
        <div className="feed__thumbnail" key={p.id}>
          <img src={p.thumbnail_src} alt="saying something because lintr" />
        </div>
      )
    })

    const grid = (
      <BottomScrollListener onBottom={mediaLoading ? null : handlePagination}>
        {scrollRef => (
          <div ref={scrollRef} className="feed__grid">
            {mappedFeed}
          </div>
        )}
      </BottomScrollListener>
    )

    return (
      <section className={`user ${animations.user}`}>
        <div className="user__main">
          <div className="user__card">
            <div className="user__card-content">
              <div className="user__card-top-bar">
                <button
                  className="user__card-btn"
                  title="Go Back"
                  onClick={goHome}
                ></button>
              </div>
              <div className="user__avatar-container">
                <div
                  className="user__avatar"
                  style={{ backgroundImage: `url(${data.profile_picture})` }}
                />
              </div>

              <ul className="user__stats" style={{ marginTop: "20px" }}>
                <li>
                  <p className="user__stat-title">Posts</p>
                  <p>{formatNumber(data.feed_info.posts_count)}</p>
                </li>
                <li>
                  <p className="user__stat-title">Followers</p>
                  <p>{formatNumber(data.followed_by)}</p>
                </li>
                <li>
                  <p className="user__stat-title">Following</p>
                  <p>{formatNumber(data.following)}</p>
                </li>
              </ul>

              <div className="feed">{mediaLoading ? mediaLoader : grid}</div>

              <ul className="user__stats">
                <li>
                  <p className="user__stat-title">Average Likes</p>
                  <p>{formatNumber(data.likes_avg)}</p>
                </li>
                <li>
                  <p className="user__stat-title">Average Comments</p>
                  <p>{formatNumber(data.comments_avg)}</p>
                </li>
                <li>
                  <p className="user__stat-title">Engagement Rate</p>
                  <p>{data.totalEngagementRate}%</p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    )
  } else {
    return <Loader />
  }
}

export default withRouter(User)
