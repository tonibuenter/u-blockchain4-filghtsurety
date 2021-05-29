import React, { useEffect, useRef, useState } from 'react';
import Container from '@material-ui/core/Container';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import Link from '@material-ui/core/Link';

type App01Props = { data: number };

export default function Render01({ data }: App01Props) {
  const [dataState, setDataState] = useState(data);
  const counterRef = useRef(0);
  counterRef.current++;

  useEffect(() => {
    setTimeout(() => setDataState((n) => n + 1), 1000);
  }, [dataState]);

  return (
    <Container maxWidth="sm">
      <Box my={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Create React App v4-beta example with TypeScript
        </Typography>

        <Copyright />
        <div>counterRef: {counterRef.current}</div>
        <div>dataState: {dataState}</div>
      </Box>
    </Container>
  );
}

function Copyright() {
  return (
    <Typography variant="body2" color="textSecondary" align="center">
      {'Copyright © '}
      <Link color="inherit" href="https://material-ui.com/">
        Your Website
      </Link>{' '}
      {new Date().getFullYear()}
      {'.'}
    </Typography>
  );
}
