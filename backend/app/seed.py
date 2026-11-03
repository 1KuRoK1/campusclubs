from datetime import datetime, timedelta

from app.auth import захешировать_пароль
from app.database import SessionLocal
from app.models import (
    ИсторияСтатусов,
    Мероприятие,
    Объявление,
    Организация,
    Отзыв,
    Пользователь,
    РольОрганизации,
    РольПользователя,
    СтатусЗаявки,
    Членство,
    Заявка,
    ОтветАнкеты,
    Уведомление,
)

ПАРОЛЬ_ДЕМО = "demo1234"


def запустить_наполнение():
    db = SessionLocal()
    try:
        if db.query(Пользователь).count() > 0:
            print("База уже заполнена, наполнение пропущено")
            return

        пароль = захешировать_пароль(ПАРОЛЬ_ДЕМО)

        администратор = Пользователь(
            email="admin@campusclubs.ru",
            password_hash=пароль,
            full_name="Ирина Смирнова",
            role=РольПользователя.АДМИНИСТРАЦИЯ,
            faculty="Управление",
        )
        db.add(администратор)

        пользователи = [
            Пользователь(email="anna.kovaleva@example.com", password_hash=пароль,
                          full_name="Анна Ковалёва", role=РольПользователя.СТУДЕНТ,
                          faculty="ИРИТ-РТФ", group="РИ-310101"),
            Пользователь(email="dmitry.sokolov@example.com", password_hash=пароль,
                          full_name="Дмитрий Соколов", role=РольПользователя.СТУДЕНТ,
                          faculty="ИРИТ-РТФ", group="РИ-310102"),
            Пользователь(email="maria.lebedeva@example.com", password_hash=пароль,
                          full_name="Мария Лебедева", role=РольПользователя.СТУДЕНТ,
                          faculty="ИНМТ", group="ИН-320201"),
            Пользователь(email="artem.volkov@example.com", password_hash=пароль,
                          full_name="Артём Волков", role=РольПользователя.СТУДЕНТ,
                          faculty="ИРИТ-РТФ", group="ПИ-310301"),
            Пользователь(email="ekaterina.morozova@example.com", password_hash=пароль,
                          full_name="Екатерина Морозова", role=РольПользователя.РУКОВОДИТЕЛЬ,
                          faculty="ИРИТ-РТФ"),
            Пользователь(email="ilya.nikitin@example.com", password_hash=пароль,
                          full_name="Илья Никитин", role=РольПользователя.РУКОВОДИТЕЛЬ,
                          faculty="ИНМТ"),
            Пользователь(email="olga.pavlova@example.com", password_hash=пароль,
                          full_name="Ольга Павлова", role=РольПользователя.РУКОВОДИТЕЛЬ,
                          faculty="ИРИТ-РТФ"),
            Пользователь(email="sergey.zakharov@example.com", password_hash=пароль,
                          full_name="Сергей Захаров", role=РольПользователя.СТУДЕНТ,
                          faculty="ИНМТ", group="ИН-320202"),
            Пользователь(email="tatyana.belova@example.com", password_hash=пароль,
                          full_name="Татьяна Белова", role=РольПользователя.СТУДЕНТ,
                          faculty="ИРИТ-РТФ", group="РИ-310103"),
        ]
        db.add_all(пользователи)
        db.flush()

        екатерина, илья, ольга = пользователи[4], пользователи[5], пользователи[6]
        анна, дмитрий, мария, артём, сергей, татьяна = пользователи[:4] + пользователи[7:]

        организации = [
            Организация(name="Студенческий совет ИРИТ-РТФ",
                        description="Представляет интересы студентов института, организует общие собрания и взаимодействие с администрацией.",
                        direction="Студенческое самоуправление", format="Очный", faculty="ИРИТ-РТФ",
                        size=24, contacts="studsovet@example.com, ауд. 412", lead_id=екатерина.id),
            Организация(name="Клуб робототехники",
                        description="Разработка и сборка роботов, подготовка к соревнованиям, изучение микроконтроллеров.",
                        direction="Наука и техника", format="Очный", faculty="ИРИТ-РТФ",
                        size=18, contacts="robotics@example.com, лаборатория 205", lead_id=ольга.id),
            Организация(name="Научное общество кибербезопасности",
                        description="Изучение методов защиты информации, участие в CTF-соревнованиях, разбор реальных инцидентов.",
                        direction="Наука и техника", format="Смешанный", faculty="ИРИТ-РТФ",
                        size=15, contacts="cybersec@example.com", lead_id=илья.id),
            Организация(name="Волейбольная секция",
                        description="Тренировки и участие в межфакультетских турнирах по волейболу.",
                        direction="Спорт", format="Очный", faculty="ИНМТ",
                        size=32, contacts="volleyball@example.com, спортзал", lead_id=илья.id),
            Организация(name="Клуб настольных игр",
                        description="Еженедельные встречи за настольными играми, турниры и обучение новым играм.",
                        direction="Досуг", format="Очный", faculty="ИРИТ-РТФ",
                        size=27, contacts="boardgames@example.com", lead_id=екатерина.id),
            Организация(name="Театральная студия",
                        description="Подготовка спектаклей, тренинги по актёрскому мастерству, выступления на университетских сценах.",
                        direction="Творчество", format="Очный", faculty="ИНМТ",
                        size=20, contacts="theatre@example.com, актовый зал", lead_id=ольга.id),
            Организация(name="Экологический отряд",
                        description="Субботники, экологические акции, раздельный сбор отходов на кампусе.",
                        direction="Экология", format="Очный", faculty="ИРИТ-РТФ",
                        size=14, contacts="eco@example.com", lead_id=екатерина.id),
            Организация(name="Клуб программирования",
                        description="Разбор алгоритмов, подготовка к олимпиадам, совместные проекты по веб-разработке.",
                        direction="Наука и техника", format="Смешанный", faculty="ИРИТ-РТФ",
                        size=41, contacts="devclub@example.com", lead_id=илья.id),
            Организация(name="Медиаклуб",
                        description="Съёмка и монтаж видео о студенческой жизни, ведение социальных сетей университета.",
                        direction="Творчество", format="Очный", faculty="ИНМТ",
                        size=16, contacts="media@example.com", lead_id=ольга.id),
            Организация(name="Спортивное ориентирование",
                        description="Выездные тренировки, участие в соревнованиях по спортивному ориентированию.",
                        direction="Спорт", format="Очный", faculty="ИРИТ-РТФ",
                        size=12, contacts="orienteering@example.com", lead_id=илья.id),
        ]
        db.add_all(организации)
        db.flush()

        for орг in организации:
            db.add_all([
                РольОрганизации(organization_id=орг.id, name="Председатель",
                                permissions="управление составом, объявления, мероприятия"),
                РольОрганизации(organization_id=орг.id, name="Секретарь",
                                permissions="документы, отчёты"),
                РольОрганизации(organization_id=орг.id, name="Член",
                                permissions="просмотр объявлений, участие в мероприятиях"),
            ])
        db.flush()

        сейчас = datetime.utcnow()

        for орг in организации[:6]:
            db.add(Объявление(
                organization_id=орг.id,
                author_id=орг.lead_id,
                title=f"Собрание организации «{орг.name}»",
                body="Очередное собрание состоится в пятницу в 18:00. Явка участников обязательна.",
                published_at=сейчас - timedelta(days=3),
            ))

        мероприятия = [
            Мероприятие(organization_id=организации[0].id, title="Общее собрание студентов института",
                        description="Обсуждение вопросов учебного процесса и студенческих инициатив.",
                        starts_at=сейчас + timedelta(days=5), ends_at=сейчас + timedelta(days=5, hours=2),
                        place="Аудитория 412", created_by=екатерина.id),
            Мероприятие(organization_id=организации[1].id, title="Весенний хакатон по робототехнике",
                        description="Командная разработка роботов за 24 часа.",
                        starts_at=сейчас + timedelta(days=14), ends_at=сейчас + timedelta(days=15),
                        place="Лаборатория 205", created_by=ольга.id),
            Мероприятие(organization_id=организации[2].id, title="Разбор CTF-задач",
                        description="Практическое занятие по решению задач категории web.",
                        starts_at=сейчас + timedelta(days=7), ends_at=сейчас + timedelta(days=7, hours=3),
                        place="Аудитория 318", created_by=илья.id),
            Мероприятие(organization_id=организации[3].id, title="Турнир по волейболу между факультетами",
                        description="Ежегодный турнир, участие сборных команд.",
                        starts_at=сейчас + timedelta(days=20), ends_at=сейчас + timedelta(days=21),
                        place="Спортивный зал", created_by=илья.id),
            Мероприятие(organization_id=организации[4].id, title="Вечер настольных игр",
                        description="Свободная игровая встреча, вход для всех желающих.",
                        starts_at=сейчас + timedelta(days=4), ends_at=сейчас + timedelta(days=4, hours=4),
                        place="Коворкинг, 2 этаж", created_by=екатерина.id),
        ]
        db.add_all(мероприятия)
        db.flush()

        заявка1 = Заявка(user_id=анна.id, organization_id=организации[1].id,
                         status=СтатусЗаявки.РАССМОТРЕНИЕ, comment="Хочу заниматься робототехникой")
        заявка2 = Заявка(user_id=дмитрий.id, organization_id=организации[0].id,
                         status=СтатусЗаявки.ПОДАНА)
        заявка3 = Заявка(user_id=мария.id, organization_id=организации[2].id,
                         status=СтатусЗаявки.СОБЕСЕДОВАНИЕ,
                         comment="Интересуюсь кибербезопасностью")
        заявка4 = Заявка(user_id=артём.id, organization_id=организации[7].id,
                         status=СтатусЗаявки.РЕШЕНИЕ)
        db.add_all([заявка1, заявка2, заявка3, заявка4])
        db.flush()

        db.add_all([
            ОтветАнкеты(application_id=заявка1.id, question="Почему хотите вступить?",
                        answer="Интересуюсь робототехникой, есть опыт сборки Arduino."),
            ОтветАнкеты(application_id=заявка1.id, question="Сколько времени готовы уделять?",
                        answer="Около 6 часов в неделю."),
            ОтветАнкеты(application_id=заявка2.id, question="Почему хотите вступить?",
                        answer="Хочу участвовать в организации студенческих мероприятий."),
            ОтветАнкеты(application_id=заявка3.id, question="Почему хотите вступить?",
                        answer="Готовлюсь к карьере в информационной безопасности."),
            ОтветАнкеты(application_id=заявка3.id, question="Есть ли опыт участия в CTF?",
                        answer="Участвовала в двух соревнованиях регионального уровня."),
            ОтветАнкеты(application_id=заявка4.id, question="Почему хотите вступить?",
                        answer="Хочу развивать навыки программирования в команде."),
        ])

        db.add_all([
            ИсторияСтатусов(application_id=заявка1.id, old_status=None, new_status="подана",
                            changed_by=анна.id, changed_at=сейчас - timedelta(days=6)),
            ИсторияСтатусов(application_id=заявка1.id, old_status="подана", new_status="рассмотрение",
                            changed_by=ольга.id, changed_at=сейчас - timedelta(days=4),
                            comment="Анкета принята к рассмотрению"),
            ИсторияСтатусов(application_id=заявка3.id, old_status="подана", new_status="рассмотрение",
                            changed_by=илья.id, changed_at=сейчас - timedelta(days=5)),
            ИсторияСтатусов(application_id=заявка3.id, old_status="рассмотрение", new_status="собеседование",
                            changed_by=илья.id, changed_at=сейчас - timedelta(days=2),
                            comment="Назначено собеседование на следующую неделю"),
        ])

        db.add_all([
            Членство(user_id=екатерина.id, organization_id=организации[0].id, role_id=None,
                     joined_at=сейчас - timedelta(days=200)),
            Членство(user_id=сергей.id, organization_id=организации[4].id, role_id=None,
                     joined_at=сейчас - timedelta(days=90)),
            Членство(user_id=татьяна.id, organization_id=организации[6].id, role_id=None,
                     joined_at=сейчас - timedelta(days=60)),
        ])

        db.add_all([
            Отзыв(organization_id=организации[0].id, user_id=сергей.id, rating=5,
                  text="Отличная организация, много полезных инициатив."),
            Отзыв(organization_id=организации[1].id, user_id=татьяна.id, rating=4,
                  text="Интересные проекты, но иногда не хватает оборудования."),
            Отзыв(organization_id=организации[4].id, user_id=анна.id, rating=5,
                  text="Дружелюбная атмосфера и много настольных игр."),
        ])

        db.add_all([
            Уведомление(user_id=анна.id, type="заявка",
                        message="Ваша заявка в клуб робототехники перешла в статус «рассмотрение».",
                        is_read=False, created_at=сейчас - timedelta(days=4)),
            Уведомление(user_id=мария.id, type="заявка",
                        message="Вам назначено собеседование в научном обществе кибербезопасности.",
                        is_read=False, created_at=сейчас - timedelta(days=2)),
            Уведомление(user_id=дмитрий.id, type="мероприятие",
                        message="Открыта запись на весенний хакатон по робототехнике.",
                        is_read=True, created_at=сейчас - timedelta(days=1)),
        ])

        db.commit()
        print("Демонстрационные данные успешно добавлены")
        print(f"Пользователей: {db.query(Пользователь).count()}")
        print(f"Организаций: {db.query(Организация).count()}")
        print(f"Заявок: {db.query(Заявка).count()}")
        print(f"Пароль для всех демо-пользователей: {ПАРОЛЬ_ДЕМО}")
    finally:
        db.close()


if __name__ == "__main__":
    запустить_наполнение()