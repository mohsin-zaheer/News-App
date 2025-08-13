import React, {useState, useMemo, useEffect} from 'react'
import styles from '../stylesheets/home.module.css'
import food from '../assets/food.png'
import animal from '../assets/animal.png'
import music from '../assets/music.png'
import sports from '../assets/sport.png'
import sportsBg from '../assets/sportBg.png'
import car from '../assets/car.png'
import abstract from '../assets/abstract.png'
import t from '../assets/t.png'
import { Icon } from "@iconify/react";
import { Circles } from 'react-loader-spinner';
import SportsCalendar from './ui/SportsCalendar'
import PastFixtures from './ui/PastFixtures'
import NextMatch from './ui/NextMatch'
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, A11y } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { useNewsStore } from '../store/useNewsStore'
import WeatherWeekWithToggle from './ui/WeatherWeekWithToggle'
import { Link } from 'react-router'
import { useBlogPosts } from '../store/useBlogPosts'


const Home = () => {

  const today = new Date();

  const articles = useNewsStore(s => s.articles);
  const newPosts = useNewsStore(s => s.newPosts);
  const videoPosts = useNewsStore(s => s.videoPosts);

  const { posts, fetchPosts } = useBlogPosts();

  // call the action via getState so you don't subscribe to it at all
  useEffect(() => {
    useNewsStore.getState().fetchAllIfNeeded();
  }, []);

  useEffect(() => { fetchPosts({ number: 100 }); }, [fetchPosts]);


  const LOCATIONS = [
  { name: "Ankara", lat: 39.93, lon: 32.86, cssCard: `${styles.wcard} ${styles.wcard1}` },
  { name: "Anchorage", lat: 61.2181, lon: -149.9003, cssCard: `${styles.wcard} ${styles.wcard2}`, overlay: `${styles.overlay2}` },
  { name: "Tokyo", lat: 35.6762, lon: 139.6503, cssCard: `${styles.wcard} ${styles.wcard3}`, overlay: `${styles.overlay3}` },
  { name: "Sydney", lat: -33.8688, lon: 151.2093, cssCard: `${styles.wcard} ${styles.wcard4}`, overlay: `${styles.overlay4}` },
];

function formatLocalNowLabel(timeZone) {
  const now = new Date();
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone,
  }).format(now);
}

function currentHourKey(timeZone) {
  const zNow = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    timeZone,
    hour12: false,
  }).formatToParts(zNow);

  const obj = {};
  parts.forEach(p => (obj[p.type] = p.value));
  return `${obj.year}-${obj.month}-${obj.day}T${obj.hour}:00`;
}

function iconForWeather(code, isDay) {
  if (code == null) return "bi:question-circle-fill";
  const day = isDay !== false;
  if (code === 0) return day ? "bi:sun-fill" : "bi:moon-stars-fill";
  if ([1, 2].includes(code)) return day ? "bi:sun" : "bi:cloud-moon";
  if (code === 3) return "bi:clouds-fill";
  if ([45, 48].includes(code)) return "bi:cloud-fog2-fill";
  if ([51, 53, 55, 56, 57].includes(code)) return "bi:cloud-drizzle-fill";
  if ([61, 63, 65, 80, 81, 82].includes(code)) return "bi:cloud-rain-heavy-fill";
  if ([66, 67].includes(code)) return "bi:cloud-rain-fill";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "bi:cloud-snow-fill";
  if ([95, 96, 99].includes(code)) return "bi:cloud-lightning-rain-fill";
  return "bi:cloud-fill";
}

  const [cards, setCards] = useState(
    LOCATIONS.map(l => ({ loading: true, name: l.name }))
  );

  const fetchAll = useMemo(() => async () => {
    const results = await Promise.all(
      LOCATIONS.map(async (loc) => {
        const url = new URL("https://api.open-meteo.com/v1/forecast");
        url.searchParams.set("latitude", String(loc.lat));
        url.searchParams.set("longitude", String(loc.lon));
        url.searchParams.set("current", [
          "temperature_2m",
          "relative_humidity_2m",
          "wind_speed_10m",
          "weather_code",
          "is_day",
        ].join(","));
        url.searchParams.set("hourly", "precipitation_probability");
        url.searchParams.set("temperature_unit", "celsius");
        url.searchParams.set("wind_speed_unit", "kmh");
        url.searchParams.set("timezone", "auto");

        try {
          const res = await fetch(url.toString());
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();

          const tz = data.timezone;
          const key = currentHourKey(tz);

          let precipPct;
          if (data?.hourly?.time && data?.hourly?.precipitation_probability) {
            const idx = data.hourly.time.indexOf(key);
            if (idx >= 0) precipPct = data.hourly.precipitation_probability[idx];
          }

          return {
            loading: false,
            name: loc.name,
            tempC: data?.current?.temperature_2m,
            humidity: data?.current?.relative_humidity_2m,
            windKmh: data?.current?.wind_speed_10m,
            precipProbPct: precipPct,
            weatherCode: data?.current?.weather_code,
            isDay: data?.current?.is_day === 1,
            localTimeLabel: formatLocalNowLabel(tz),
          };
        } catch (e) {
          return { loading: false, name: loc.name, error: e.message || "Failed to load" };
        }
      })
    );
    setCards(results);
  }, []);

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [fetchAll]);








  return (
    <div className={styles.homeBg}>
      <div className="container p-0">
        <div className={`${styles.tags} row mx-auto`}>
          <div className="col-lg-2 col-md-4 col-6">
            <div className={styles.tagBg}>
              <Link to='/category/food' className={styles.tag}>
                #food
              </Link>
              <img src={food} alt="" className={styles.tagImg} />
            </div>
          </div>
          <div className="col-lg-2 col-md-4 col-6">
            <div className={styles.tagBg}>
              <Link to='/category/domestic' className={styles.tag}>
                #animal
              </Link>
              <img src={animal} alt="" className={styles.tagImg} />
            </div>
          </div>
          <div className="col-lg-2 col-md-4 col-6">
            <Link to='/category/entertainment' className={styles.tagBg}>
              <div className={styles.tag}>
                #music
              </div>
              <img src={music} alt="" className={styles.tagImg} />
            </Link>
          </div>
          <div className="col-lg-2 col-md-4 col-6">
            <Link to='/category/sports' className={styles.tagBg}>
              <div className={styles.tag}>
                #sports
              </div>
              <img src={sports} alt="" className={styles.tagImg} />
            </Link>
          </div>
          <div className="col-lg-2 col-md-4 col-6">
            <Link to='/category/business' className={styles.tagBg}>
              <div className={styles.tag}>
                #business
              </div>
              <img src={car} alt="" className={styles.tagImg} />
            </Link>
          </div>
          <div className="col-lg-2 col-md-4 col-6">
            <Link to='/category/lifestyle' className={styles.tagBg}>
              <div className={styles.tag}>
                #abstract
              </div>
              <img src={abstract} alt="" className={styles.tagImg} />
            </Link>
          </div>
        </div>
        
        <div className={`${styles.sec1} row`}>
          <div className="col-lg-3">
            <div className={styles.card1}>
              <div className={styles.cardInner}>
                <h3 className={styles.cardTitle}>How to Drive a Car Safely</h3>
                <p className={styles.cardContent}>Ah, the joy of the open road—it’s a good feeling. But if you’re new to driving, you may feel a little nervous about getting behind the wheel.</p>
              </div>
            </div>
          </div>
          <div className="col-lg-3 px-3">
            <div className={styles.card2}>
              <div className={styles.cardInner}>
                <h3 className={styles.cardTitle}>How to Make Dance Music</h3>
                <p className={styles.cardContent}>Ah, the joy of the open road—it’s a good feeling. But if you’re new to driving, you may feel a little nervous about getting behind the wheel.</p>
              </div>
            </div>
          </div>
          <div className="col-lg-6">
            <div className={styles.card3}>
              <div className={styles.cardInner}>
                <h3 className={styles.cardTitle}>Why I Stopped Using Multiple Monitor</h3>
                <p className={styles.cardContent}>A Single Monitor Manifesto — Many developers believe multiple monitors improve productivity. Studies have proven it, right? Well, keep in mind, many of those studies are commissioned from monitor manufacturers like</p>
              </div>
            </div>
          </div>
        </div>



        <div className={styles.sec2}>
          <h2 className={styles.sec2Title}>
            <img src={t} alt="" className={styles.t}/>
            Popular Posts
          </h2>

          <div className={`${styles.posts} row`}>

            { articles.length === 0 ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                  <Circles
                    height="80"
                    width="80"
                    color="#4fa94d"
                    ariaLabel="circles-loading"
                    wrapperStyle={{}}
                    wrapperClass=""
                    visible={true}
                  />
                </div>
              ) : (articles.map((article, index) => (
                <div className="col-lg-3" key={index}>
                  <Link className={styles.postCard} to={`/posts/${article.id}`}>
                    <img src={article.image_url} alt="Article" className={styles.postImg} />
                    <h3 className={styles.postTitle}>{article.title}</h3>
                    <p className={styles.pContent}>
                      {article.description || article.content || 'No description available.'}
                    </p>

                    <div className={styles.authorBg}>
                      <div className={styles.author}>
                        <img
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                            article.creator || 'Unknown'
                          )}&background=random`}
                          alt="Author"
                          className={styles.authorImg}
                        />
                        <div className={styles.authorInfo}>
                          <h6 className={styles.aName}>{article.creator || 'Unknown Author'}</h6>
                          <p className={styles.pDate}>
                            {new Date(article.pubDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>

                      <Icon icon="akar-icons:ribbon" className={styles.saveIco} />
                    </div>
                  </Link>
                </div>
              )))}



          </div>


        </div>

      


      </div>



        <div className={styles.sec3}>
          <div className="container p-0">
            <div className="row">
              <div className="col-lg-4 p-0 m-0">
                <SportsCalendar  year={today.getFullYear()} month={today.getMonth()}/>
              </div>
              <div className="col-lg-5">
                <PastFixtures/>
              </div>
              <div className="col-lg-3 p-0 m-0">
                <NextMatch/>
              </div>
            </div>
          </div>

          <img src={sportsBg} alt="" className={styles.sportBg} />
        </div>

        <div className="container">
          <div className={styles.sec4}>
            <div className={styles.sec4Top}>
              <h2 className={styles.sec2Title}>
                <img src={t} alt="" className={styles.t}/>
                Popular Posts
              </h2>

              <button className={styles.sec4Btn}>Show All <Icon icon="iconoir:nav-arrow-right" className={styles.btnIcon} /></button>


            </div>



            <div className={`${styles.newPosts} row`}>

            { newPosts?.length === 0 ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                  <Circles
                    height="80"
                    width="80"
                    color="#4fa94d"
                    ariaLabel="circles-loading"
                    wrapperStyle={{}}
                    wrapperClass=""
                    visible={true}
                  />
                </div>
              ) : (newPosts.map((article, index) => (
                <div className="col-lg-6" key={index}>
                  <Link to={`/posts/${article.article_id}`} className={styles.newPostCard}>
                    <div className={styles.postImgBg}>
                      <img src={article.image_url} alt="Article" className={styles.newPostImg} />

                    </div>

                    <div className={styles.newPostCardInner}>
                      <h3 className={styles.postTitle}>{article.title}</h3>
                      <p className={styles.pContent}>
                        {article.description || article.content || 'No description available.'}
                      </p>

                      <div className={styles.authorBg}>
                        <div className={styles.author}>
                          <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                              article.creator || 'Unknown'
                            )}&background=random`}
                            alt="Author"
                            className={styles.authorImg}
                          />
                          <div className={styles.authorInfo}>
                            <h6 className={styles.aName}>{article.creator || 'Unknown Author'}</h6>
                            <p className={styles.pDate}>
                              {new Date(article.pubDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>

                        <Icon icon="akar-icons:ribbon" className={styles.saveIco} />
                      </div>

                    </div>
                  </Link>
                </div>
              )))}



          </div>

          </div>
        </div>

          <div className={styles.sec5}>
            <div className="container">

            
                <div className={styles.sec4Top}>
                  <h2 className={styles.sec2Title}>
                    <img src={t} alt="" className={styles.t}/>
                    latest videos
                  </h2>

                  <button className={styles.sec4Btn}>Show All <Icon icon="iconoir:nav-arrow-right" className={styles.btnIcon} /></button>


                </div>



                <div className={`${styles.newPosts} row`}>

                  {
                      videoPosts?.length === 0 ? (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                          <Circles
                            height="80"
                            width="80"
                            color="#4fa94d"
                            ariaLabel="circles-loading"
                            visible={true}
                          />
                        </div>
                      ) : (
                        <div className={styles.swiperWrapper}>
                        <Swiper
                          modules={[Navigation, Pagination, A11y]}
                          spaceBetween={30}
                          slidesPerView={1}
                        
                          pagination={{ clickable: true, el: '.custom-swiper-pagination' }}
                          breakpoints={{
                            768: {
                              slidesPerView: 2
                            }
                          }}
                        >
                          {videoPosts.map((article, index) => (
                            <SwiperSlide key={index}>
                              <div className={styles.videoPostCard}>
                                <div className={styles.postVideoBg}>
                                  <iframe
                                    src={article.video_url.replace('watch?v=', 'embed/')}
                                    title={`YouTube video player ${index}`}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className={styles.newPostIframe}
                                  ></iframe>
                                </div>

                                <div className={styles.videoPostCardInner}>
                                  <h3 className={styles.postTitle}>{article.title}</h3>
                                  <p className={styles.pContent}>
                                    {article.description || article.content || 'No description available.'}
                                  </p>
                                </div>
                              </div>
                            </SwiperSlide>
                          ))}
                        </Swiper>

                        {/* This renders the bullets outside the slider */}
                        <div className="custom-swiper-pagination"></div>
                      </div>

                      )
                    }



                </div>

            </div>

          </div>

          <div className="container">
            <div className={`${styles.sec6} row`}>
              <div className="col-md-6">
                <WeatherWeekWithToggle/>
              </div>
              <div className="col-md-6">
                <div className={styles.wcardBg}>
                  <div className={styles.cardsRow}>
                    {cards.slice(0, 2).map((card, i) => {
                      const loc = LOCATIONS[i];
                      const iconId = iconForWeather(card.weatherCode, card.isDay);
                      return (
                        <div key={loc.name} className={loc.cssCard}>
                          <div className={`${styles.wcardOverlay} ${loc.overlay || ""}`}>
                            <div className={styles.wcardInfo}>
                              <div className={styles.wInfoLeft}>
                                <div className={styles.wInfo}>
                                  {card.loading ? "Precipitation: —" : `Precipitation: ${card.precipProbPct ?? 0}%`}
                                </div>
                                <div className={styles.wInfo}>
                                  {card.loading ? "Humidity: —" : `Humidity: ${card.humidity ?? 0}%`}
                                </div>
                                <div className={styles.wInfo}>
                                  {card.loading ? "Wind: —" : `Wind: ${Math.round(card.windKmh ?? 0)} km/h`}
                                </div>
                              </div>
                              <div className={styles.wInfoRight}>
                                <h6 className={styles.cityName}>{card.name}</h6>
                                <div className={styles.wInfo}>
                                  {card.loading ? "—" : card.localTimeLabel}
                                </div>
                              </div>
                            </div>
                            <div className={styles.wTemp}>
                              <Icon icon={iconId} className={styles.wIcon} />
                              {card.loading ? "—" : `${Math.round(card.tempC ?? 0)} °C`}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className={styles.cardsRow}>
                    {cards.slice(2, 4).map((card, idx) => {
                      const i = idx + 2;
                      const loc = LOCATIONS[i];
                      const iconId = iconForWeather(card.weatherCode, card.isDay);
                      return (
                        <div key={loc.name} className={loc.cssCard}>
                          <div className={`${styles.wcardOverlay} ${loc.overlay || ""}`}>
                            <div className={styles.wcardInfo}>
                              <div className={styles.wInfoLeft}>
                                <div className={styles.wInfo}>
                                  {card.loading ? "Precipitation: —" : `Precipitation: ${card.precipProbPct ?? 0}%`}
                                </div>
                                <div className={styles.wInfo}>
                                  {card.loading ? "Humidity: —" : `Humidity: ${card.humidity ?? 0}%`}
                                </div>
                                <div className={styles.wInfo}>
                                  {card.loading ? "Wind: —" : `Wind: ${Math.round(card.windKmh ?? 0)} km/h`}
                                </div>
                              </div>
                              <div className={styles.wInfoRight}>
                                <h6 className={styles.cityName}>{card.name}</h6>
                                <div className={styles.wInfo}>
                                  {card.loading ? "—" : card.localTimeLabel}
                                </div>
                              </div>
                            </div>
                            <div className={styles.wTemp}>
                              <Icon icon={iconId} className={styles.wIcon} />
                              {card.loading ? "—" : `${Math.round(card.tempC ?? 0)} °C`}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>


            
            <div className={styles.sec7}>
              <h2 className={styles.sec2Title}>
                <img src={t} alt="" className={styles.t}/>
                Blog Posts
              </h2>

              <div className={`${styles.posts} row`}>

                { posts.length === 0 ? (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                      <Circles
                        height="80"
                        width="80"
                        color="#4fa94d"
                        ariaLabel="circles-loading"
                        wrapperStyle={{}}
                        wrapperClass=""
                        visible={true}
                      />
                    </div>
                  ) : (posts.slice(0, 4).map((article, index) => (
                    <div className="col-lg-3" key={index}>
                      <Link className={styles.postCard} to={`/posts/${article.id}`}>
                        <img src={article.coverImage} alt="Article" className={styles.postImg} />
                        <h3 className={styles.postTitle}>{article.title}</h3>
                        <p className={styles.pContent}>
                          {article.description || 'No description available.'}
                        </p>

                        <div className={styles.authorBg}>
                          <div className={styles.author}>
                            <img
                              src={article.authorImage}
                              alt="Author"
                              className={styles.authorImg}
                            />
                            <div className={styles.authorInfo}>
                              <h6 className={styles.aName}>{article.authorName || 'Unknown Author'}</h6>
                              <p className={styles.pDate}>
                                {new Date(article.date).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>

                          <Icon icon="akar-icons:ribbon" className={styles.saveIco} />
                        </div>
                      </Link>
                    </div>
                  )))}



              </div>


            </div>
          </div>

    </div>
  )
}

export default Home; 