import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Shared 404: rendered inside whichever layout the URL fell through
 *  (store navbar for /xyz, admin sidebar for /admin/xyz). */
@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink],
  templateUrl: './not-found-page.html',
  styleUrl: './not-found-page.scss',
})
export class NotFoundPage {}
