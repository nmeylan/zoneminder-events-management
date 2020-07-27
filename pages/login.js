import {useRouter} from "next/router";
import Head from "next/head";
import {useRef, useState} from "react";
import {post} from "../lib/Ajax";

const Login = () => {
  const router = useRouter()
  const [isError, setIsError] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const usernameField = useRef()
  const passwordField = useRef()

  function onSubmit(e) {
    e.preventDefault()
    console.log('login');
    post('/api/login', {
      body: {
        username: usernameField.current.value,
        password: passwordField.current.value
      }
    })
      .then((response) =>  {
        if (response.status === 200) {
        router.replace('/')
        } else {
          setIsError(true)
        }
      })
  }

  return (
    <>
      <Head>
        <title>Login</title>
      </Head>
      <div id="login-page">
        <form onSubmit={onSubmit} className={`vertical ${isError ? 'has-error' : ''}`}>
          {isError && (
            <p className="text-danger">Invalid username or password</p>
          )}
          <div className="form-group">
            <label htmlFor="username-field">Username</label>
            <input type="text" name="username" id="username-field" ref={usernameField}/>
          </div>
          <div className="form-group">
            <label htmlFor="password-field">Password</label>
            <input type="password" name="password" id="password-field" ref={passwordField}/>
          </div>
          <div className="form-group">
            <button type="submit" className="btn btn-primary">Login</button>
          </div>
        </form>
      </div>
    </>
  )
}

export default Login;