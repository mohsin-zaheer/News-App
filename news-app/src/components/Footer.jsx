import React, { useEffect, useState } from 'react';
import styles from '../stylesheets/footer.module.css'
import t from '../assets/t.png'
import { Icon } from "@iconify/react";
import '../App.css'

import {Link} from 'react-router-dom'


const Footer = () => {
  const [comments, setComments] = useState([]);

  useEffect(() => {
    fetch('https://dummyjson.com/comments?limit=50')
      .then((res) => res.json())
      .then((data) => {
        const filtered = data.comments
          .map((c) => {
            const words = c.body.split(' ');
            if (words.length > 15) return { ...c, body: words.slice(0, 15).join(' ') + '…' };
            if (words.length < 5) return null; // skip too short
            return c;
          })
          .filter(Boolean)
          .slice(0, 3); // only keep 3
        setComments(filtered);
      })
      .catch((err) => console.error('Error fetching comments:', err));
  }, []);


   const [images, setImages] = useState([]);

  useEffect(() => {
    fetch('https://picsum.photos/v2/list?page=2&limit=9')
      .then((res) => res.json())
      .then((data) => {
        // Map the API data to an array of image URLs
        const imageUrls = data.map((img) => img.download_url);
        setImages(imageUrls);
      })
      .catch((err) => console.error('Error fetching images:', err));
  }, []);




  return (
    <div className={styles.footerBg}>


        <div className="container">

      
        <div className={`${styles.footer} row`}>
            <div className="col-md-6">
                <div className={styles.fLeft}>
                    <div className="row">
                        <div className="col-md-8">
                            <div className={styles.infoBg}>
                                <h2 className='f_Title'>
                                    <img src={t} alt="" className={styles.t}/>
                                Daily Breif
                                </h2>

                                <p className={styles.fInfo}> Daily Brief delivers concise daily updates covering news, weather, sports, and more, keeping users informed in one place. It’s designed for quick reading, ensuring you stay updated with essential highlights from multiple topics every day.</p>

                                <h2 className='f_Title'>
                                    <img src={t} alt="" className={styles.t}/>
                                Newsletters
                                </h2>
                                <div className={styles.inpBg}>
                                    <input type="email" name="email" id="email" className={styles.inp} placeholder='Your Email Address'/>
                                    <Icon icon="material-symbols:mail-rounded" className={styles.inpIcon}/>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-4">

                            <div className={styles.catBg}>
                                <h2 className='f_Title'>
                                        <img src={t} alt="" className={styles.t}/>
                                    Categories
                                </h2>

                                 <Link className={styles.cat} to='/category/sports' >Sports</Link>
                                 <Link className={styles.cat} to='/category/food' >Food</Link>
                                 <Link className={styles.cat} to='/category/crime' >Crime</Link>
                                 <Link className={styles.cat} to='/category/education' >Education</Link>
                                 <Link className={styles.cat} to='/category/politics' >Politics</Link>

                                <h2 className='f_Title mt-4 '>
                                    <img src={t} alt="" className={styles.t}/>
                                 social network
                                </h2>

                                <div className={styles.fbtnBg}>

                                    <button className={styles.fBtn}>
                                        <Icon icon="mdi:instagram" className={styles.fIcon}/>
                                        instagram
                                    </button>
                                    <button className={styles.fBtn2}>
                                        <Icon icon="mdi:twitter" className={styles.fIcon2}/>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className={styles.copyright}>
                            <div className={styles.copyLeft}>
                                privacy policy | terms & conditions
                            </div>
                            
                            
                            <div className={styles.copyRight}>
                                all copyright © 2025 reserved 
                            </div>

                        </div>
                    </div>
                    
                </div>
            </div>

            <div className="col-md-3">
                <div className={styles.commentBg}>
                    <h2 className='f_Title'>
                          <img src={t} alt="" className={styles.t}/>
                        new Comments 
                      </h2>

                      {comments.map((comment) => (
                        <div key={comment.id} className={styles.commentCard}>
                        <h3 className={styles.commenter}>{comment.user.username}</h3>
                        <p className={styles.comment}>{comment.body}</p>
                        </div>
                    ))} 
                </div>
            </div>


            <div className="col-md-3">
                <div className={styles.instaBg}>
                    <h2 className='f_Title'>
                        <img src={t} alt="" className={styles.t}/>
                        Follow on Instagram
                    </h2>

                    <div className="row m-0 p-0">
                        {images.map((image, index) => (
                            <div key={index} className="col-4 m-0 p-0">
                                <div className={styles.imgBg}>
                                    <img src={image} alt="" className={styles.image} />
                                </div>
                            </div>
                        ))}
                    </div>



                </div>

            </div>
        </div>


        </div>

    </div>
  )
}

export default Footer;