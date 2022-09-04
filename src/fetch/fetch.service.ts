import { HttpService } from '@nestjs/axios';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom, map } from 'rxjs';

type Method = 'get' | 'post';
type Func = 'sendMessage' | 'sendMediaGroup' | 'sendLocation';

interface IFetch {
  method: Method;
  base: {
    func: Func;
    token: string;
  };
  params?: Record<string, any>;
  body?: Record<string, any>;
}

@Injectable()
export class FetchService {
  private telegramBaseUrl: string;
  constructor(
    private readonly http: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.telegramBaseUrl = configService.get('telegramBaseUrl');
  }

  async fetch<T>({ method, base, params, body }: IFetch) {
    let url = `${this.telegramBaseUrl}${base.token}/${base.func}`;
    const urlParams = new URLSearchParams(params).toString();
    if (urlParams) {
      url = `${url}?${urlParams}`;
    }
    const $result = this.http[method]<T>(url, body).pipe(
      map((res) => res.data),
    );
    const result = await lastValueFrom($result).catch((err) => {
      throw new ForbiddenException(err.response.data.description);
    });
    return result;
  }
  async sendNotification<T>({ url, body }) {
    const $result = this.http.post<T>(url, body).pipe(map((res) => res.data));
    await lastValueFrom($result).catch((err) => {
      throw new ForbiddenException(err.response.data.description);
    });
  }
}
