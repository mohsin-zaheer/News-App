import React from 'react'
import styles from '../stylesheets/about.module.css'
import { Icon } from '@iconify/react';
import { Link } from 'react-router-dom';
import t from '../assets/t.png';




const About = () => {
  return (
    <div className={styles.aboutBg}>
        <div className="container  p-0">
             <div className={styles.breadcrumb}>
                <a href="/" className={styles.breadcrumbItem}>Home</a>
                <Icon icon="material-symbols-light:keyboard-arrow-right" className={styles.breadcrumbIcon} />
                <span className={styles.active}>{'About Us'}</span>
              </div>
        <div className={styles.aboutContainer}>
            <h2 className={styles.title}>Stay Informed, Effortlessly</h2>

            <div className={styles.inner}>
                <p className={styles.info}>

                Daily Brief is your go-to source for staying informed with ease, delivering concise daily updates on news, weather, sports, and more—all in one convenient place. Designed for quick reading, it provides essential highlights across multiple topics, helping you keep up with what matters most without spending hours scrolling. Whether you’re starting your day or catching up on the go, Daily Brief ensures you’re always in the know.

                </p>


                <iframe  src="https://www.youtube.com/embed/GdePkD-ktso?si=vEMQDU7anaf6cmek" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen className={styles.abtVideo}></iframe>
            </div>
        
        </div>


        </div>


        <div className="row my-5 mx-0 p-0">
            <div className="col-md-7 p-0 m-0">
                <div className={styles.mapBg}>
                    <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d387196.0769330399!2d-74.30916636122527!3d40.69667264836119!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c24fa5d33f083b%3A0xc80b8f06e177fe62!2sNew%20York%2C%20NY%2C%20USA!5e0!3m2!1sen!2s!4v1754840916029!5m2!1sen!2s"
                    
                    height="400"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade" className={styles.map}
                    />

                </div>
            </div>
            <div className="col-md-5">
                <div className={styles.contactInfo}>
                    <h2 className={styles.stitle}>
                           <img src={t} alt="" className={styles.t}/>
                           Daily Breif information
                   </h2>

                   <div className={styles.cInfoBg}>
                        <div className={styles.cInfo}>
                            <Icon icon="material-symbols-light:mail"  className={styles.cIcon}/>
                            email : Management@dailybreif.com
                        </div>
                        <div className={styles.cInfo}>
                            <Icon icon="icon-park-solid:phone"  className={styles.cIcon}/>
                            Phone number : +1(234) 567-8910
                        </div>
                        <div className={styles.cInfo}>
                            <Icon icon="material-symbols-light:fax"  className={styles.cIcon}/>
                            fax : +1(234) 567-8910
                        </div>
                        <div className={`${styles.cInfo} mb-0`}>
                            <Icon icon="flowbite:address-book-solid"  className={styles.cIcon}/>
                            Address : 1234 Foxrun St.New Lenox, IL 123456
                        </div>

                   </div>

                   <div className={styles.support}>
                     <Icon icon="akar-icons:clock"  className={styles.cIcon}/> Responding 24 hours a day, 7 days a week
                   </div>



                </div>
            </div>
        </div>
    </div>
  )
}

export default About;